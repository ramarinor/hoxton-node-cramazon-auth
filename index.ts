import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function createToken(id: number) {
  const token = jwt.sign({ id: id }, 'shhhh', { expiresIn: '3days' });
  return token;
}

async function getUserFromToken(token: string) {
  const data = jwt.verify(token, 'shhhh');
  const user = await prisma.user.findUnique({
    // @ts-ignore
    where: { id: data.id },
    include: { orders: { include: { item: true } } }
  });

  return user;
}

const prisma = new PrismaClient({
  log: ['query', 'error', 'info', 'warn']
});

const PORT = 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany();
    res.send(items);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.get('/items/:title', async (req, res) => {
  const title = req.params.title;
  try {
    const item = await prisma.item.findUnique({ where: { title } });
    if (item) res.send(item);
    else res.status(404).send({ error: 'Item not found' });
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.post('/sign-up', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const hash = bcrypt.hashSync(password);
    const user = await prisma.user.create({
      data: { email, password: hash, name },
      include: { orders: { include: { item: true } } }
    });
    res.send({ user, token: createToken(user.id) });
  } catch (err) {
    // @ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: { orders: { include: { item: true } } }
    });
    // @ts-ignore
    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (user && passwordMatches) {
      res.send({ user, token: createToken(user.id) });
    } else {
      throw Error('Boom');
    }
  } catch (err) {
    res.status(400).send({ error: 'Email/password invalid.' });
  }
});

app.get('/validate', async (req, res) => {
  const token = req.headers.authorization || '';

  try {
    const user = await getUserFromToken(token);
    res.send(user);
  } catch (err) {
    // @ts-ignore
    res.status(400).send({ error: err.message });
  }
});

// // - Update an existing user
app.patch('/users/:email', async (req, res) => {
  const token = req.headers.authorization || '';
  const { name, email } = req.body;
  try {
    let user = await getUserFromToken(token);
    if (user) {
      user = await prisma.user.update({
        //@ts-ignore
        where: { id: user.id },
        data: { email: email ?? user.email, name: name ?? user.name },
        include: { orders: { include: { item: true } } }
      });
      res.send(user);
    } else res.status(404).send({ error: 'User not found' });
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});

// - Place (create) an order
app.post('/orders', async (req, res) => {
  const { title, quantity } = req.body;
  const token = req.headers.authorization || '';
  try {
    let user = await getUserFromToken(token);
    user = await prisma.user.update({
      //@ts-ignore
      where: { id: user.id },
      data: { orders: { create: { quantity, item: { connect: { title } } } } },
      include: { orders: { include: { item: true } } }
    });
    res.send(user);
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.delete('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const token = req.headers.authorization || '';
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    let user = await getUserFromToken(token);
    if (order && user && order.userId === user.id) {
      await prisma.order.delete({ where: { id } });
      user = await prisma.user.findUnique({
        // @ts-ignore
        where: { id: user.id },
        include: { orders: { include: { item: true } } }
      });
      res.send(user);
    } else {
      res.status(404).send({ error: 'This order does not exist!' });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.patch('/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const token = req.headers.authorization || '';
  const { quantity } = req.body;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    let user = await getUserFromToken(token);
    if (order && user && order.userId === user.id) {
      await prisma.order.update({ where: { id }, data: { quantity } });
      user = await prisma.user.findUnique({
        // @ts-ignore
        where: { id: user.id },
        include: { orders: { include: { item: true } } }
      });
      res.send(user);
    } else {
      res.status(404).send({ error: 'This order does not exist!' });
    }
  } catch (error) {
    //@ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server up: http://localhost:${PORT}`));
