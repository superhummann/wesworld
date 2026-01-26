const path = require('path');
const fs = require('fs');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const normalizeIp = (ip) => {
  if (!ip) return '';
  return ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return normalizeIp(forwarded.split(',')[0].trim());
  }
  return normalizeIp(req.socket?.remoteAddress || req.ip);
};

const adminAllowlist = (process.env.ADMIN_ALLOWED_IPS || '127.0.0.1,::1')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map(normalizeIp);

const restrictAdmin = (req, res, next) => {
  const clientIp = getClientIp(req);
  if (adminAllowlist.includes(clientIp)) {
    return next();
  }
  return res.status(403).send('Access denied.');
};

app.use('/admin', restrictAdmin);
app.use('/admin.html', restrictAdmin);
app.use('/api/messages', restrictAdmin);

app.use(express.static(path.join(__dirname, 'public')));

const pageMap = {
  '/': 'index.html',
  '/about': 'about.html',
  '/services': 'services.html',
  '/portfolio': 'portfolio.html',
  '/blog': 'blog.html',
  '/blog-15-ways': 'blog-15-ways.html',
  '/blog-local-seo': 'blog-local-seo.html',
  '/blog-landing-pages': 'blog-landing-pages.html',
  '/blog-automation-playbooks': 'blog-automation-playbooks.html',
  '/blog-wordpress-migration': 'blog-wordpress-migration.html',
  '/blog-malware': 'blog-malware.html',
  '/blog-website-design': 'blog-website-design.html',
  '/blog-design-trends': 'blog-design-trends.html',
  '/blog-redesign-checklist': 'blog-redesign-checklist.html',
  '/blog-social-platforms': 'blog-social-platforms.html',
  '/blog-social-media-tips': 'blog-social-media-tips.html',
  '/blog-link-building': 'blog-link-building.html',
  '/admin': 'admin.html',
  '/contact': 'contact.html',
  '/privacy': 'privacy.html',
  '/website-services': 'website-services.html',
  '/webapp-development': 'webapp-development.html',
  '/marketing-services': 'marketing-services.html',
  '/ecommerce-website': 'ecommerce-website.html'
};

Object.entries(pageMap).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', file));
  });
});

const dataDir = path.join(__dirname, 'data');
const messagesFile = path.join(dataDir, 'messages.json');

const loadMessages = () => {
  try {
    if (!fs.existsSync(messagesFile)) return [];
    const raw = fs.readFileSync(messagesFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
};

const saveMessage = (entry) => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const messages = loadMessages();
    messages.unshift(entry);
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Failed to save message:', error);
  }
};

const deleteMessage = (id) => {
  try {
    if (!fs.existsSync(messagesFile)) return false;
    const messages = loadMessages();
    const next = messages.filter((message) => String(message.id) !== String(id));
    if (next.length === messages.length) return false;
    fs.writeFileSync(messagesFile, JSON.stringify(next, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to delete message:', error);
    return false;
  }
};

app.get('/api/messages', (req, res) => {
  res.json(loadMessages());
});

app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const removed = deleteMessage(id);
  if (!removed) {
    return res.status(404).json({ ok: false, message: 'Message not found.' });
  }
  return res.json({ ok: true });
});

app.post('/api/messages/delete', (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ ok: false, message: 'Missing message id.' });
  }
  const removed = deleteMessage(id);
  if (!removed) {
    return res.status(404).json({ ok: false, message: 'Message not found.' });
  }
  return res.json({ ok: true });
});

async function maybeSendEmail(payload) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `WesWorld Contact <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_TO || process.env.SMTP_USER || 'hello@wesworld.online',
    subject: `New WesWorld inquiry from ${payload.name}`,
    replyTo: payload.email,
    text: [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone || 'N/A'}`,
      `Service: ${payload.service}`,
      `Message: ${payload.message}`
    ].join('\n')
  });

  return { sent: true };
}

app.post('/contact', async (req, res, next) => {
  try {
    const { name, email, message, service } = req.body || {};
    const phone = req.body?.phone;

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        message: 'Please share your name, email, and a quick message.'
      });
    }

    const payload = {
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : '',
      message: String(message).trim(),
      service: service ? String(service).trim() : 'General Inquiry'
    };

    console.log('New contact submission:', payload);
    saveMessage({
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...payload
    });

    const emailResult = await maybeSendEmail(payload);

    return res.status(200).json({
      ok: true,
      message: 'Thanks for reaching out! Wes will reply within 24 hours.',
      emailSent: emailResult.sent
    });
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    ok: false,
    message: 'Something went wrong on our side. Please try again soon.'
  });
});

app.listen(PORT, () => {
  console.log(`WesWorld server running on port ${PORT}`);
});
