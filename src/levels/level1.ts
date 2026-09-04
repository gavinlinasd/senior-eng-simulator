import { board, defineLevel } from './build'

const web = (count: number) => ({ type: 'web' as const, count })

export const level1 = defineLevel({
  id: 1,
  title: 'Twitter/X traffic',
  brief:
    'People liked what they saw. One of them posted it on X and it’s going viral: traffic will climb to 1,000 requests a second. Keep every component under 100%.',
  targetQps: 1000,
  budget: 340,
  introduces: ['lb'],
  start: board('users', 'web'),
  solutions: [board('users', 'lb', web(4)), board('users', 'lb', { type: 'bigweb', count: 2 })],
  traps: [board('users', 'bigweb'), board('users', 'lb', [{ type: 'bigweb' }, { type: 'web' }])],
  stars: { three: 200, two: 130 },
  hints: [
    'Users only know one address. A second server next to the first one changes nothing until something can spread requests across them.',
    'The load balancer is that one address. Put it between Users and the servers, then wire several servers behind it.',
    'Four small servers behind the balancer share 1,000 requests a second at 250 each. Check the budget before adding a fifth.',
  ],
  lesson: {
    title: 'You just did **horizontal scaling**',
    body: 'No single box could serve 1,000 requests a second, so a **load balancer** spread the work across several. That’s **horizontal scaling**: more boxes, not a bigger box. Users see **one address**; **round robin** picks the box for each request.',
  },
})
