import { Prisma, PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

const items: Prisma.ItemCreateInput[] = [
  {
    title: 'Green Socks',
    image:
      'https://media.mysockfactory.ch/1313-thickbox_default/plain-green-socks.jpg',
    price: 1.99
  },
  {
    title: 'Blue Pyjamas',
    image:
      'https://cdn.childrensalon.com/media/catalog/product/cache/0/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/t/u/turquaz-boys-blue-cotton-pyjamas-86745-6b6d9bd739c841e5d0a9eea30b6127d8f50fb48d.jpg',
    price: 9.49
  },
  {
    title: 'Black Sunglasses',
    image:
      'https://cdn.shopify.com/s/files/1/0029/7900/4480/products/LSP1902078_2_UNREAL_08652d33-5a0c-4a2d-98ea-d31dfa103550_1600x.jpg?v=1629421553',
    price: 25.24
  },
  {
    title: 'Red Backpack',
    image: 'https://m.media-amazon.com/images/I/A1umI+PwGFL._AC_SL1500_.jpg',
    price: 19.99
  }
];

const users: Prisma.UserCreateInput[] = [
  {
    name: 'Rinor',
    email: 'rinor@gmail.com',
    password: bcryptjs.hashSync('rinor123', 8),
    orders: {
      create: [
        { quantity: 9, item: { connect: { title: 'Green Socks' } } },
        { quantity: 2, item: { connect: { title: 'Black Sunglasses' } } }
      ]
    }
  },
  {
    name: 'Nicolas',
    email: 'nico@gmail.com',
    password: bcryptjs.hashSync('nico123', 8),
    orders: {
      create: [
        { quantity: 5, item: { connect: { title: 'Blue Pyjamas' } } },
        { quantity: 1, item: { connect: { title: 'Red Backpack' } } }
      ]
    }
  },
  {
    name: 'ed',
    email: 'ed@gmail.com',
    password: bcryptjs.hashSync('ed1234', 8)
  }
];

async function createStuff() {
  for (const item of items) {
    await prisma.item.create({ data: item });
  }
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
}
createStuff();
