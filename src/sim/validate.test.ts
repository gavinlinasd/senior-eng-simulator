import { describe, expect, it } from 'vitest'
import { validate } from './validate'
import { behindLb, chain, edge, node, repeat } from './fixtures'
import { level1 } from '../levels/level1'

describe('validate', () => {
  it('accepts the start graph and the intended solutions', () => {
    expect(validate(level1.start, level1)).toEqual([])
    expect(validate(behindLb(...repeat('web', 4)), level1)).toEqual([])
    expect(validate(behindLb(...repeat('web', 5)), level1)).toEqual([])
    expect(validate(behindLb('bigweb', 'bigweb'), level1)).toEqual([])
  })

  it('LB + 6 web servers is over budget by $50', () => {
    expect(validate(behindLb(...repeat('web', 6)), level1)).toEqual(['Over budget by $50.'])
  })

  it('users with two outgoing edges is an error', () => {
    const g = chain('web')
    g.nodes.push(node('web', 'web2'))
    g.edges.push(edge('users', 'web2'))
    expect(validate(g, level1)).toContain('Users only know one address. Connect them to exactly one component.')
  })

  it('a cycle is an error', () => {
    const g = chain('web', 'web')
    g.edges.push(edge('web2', 'web1'))
    expect(validate(g, level1)).toContain('Requests are going around in a loop. Remove the cycle.')
  })

  it('users not connected to anything is an error', () => {
    const g = { nodes: [node('users', 'users'), node('web', 'web1')], edges: [] }
    const errors = validate(g, level1)
    expect(errors).toContain("Users aren't connected to anything yet.")
    expect(errors).toContain("Web server web1 isn't receiving any traffic. Connect it or remove it.")
  })

  it('a load balancer with nothing behind it is an error', () => {
    const g = chain('lb')
    expect(validate(g, level1)).toEqual(['Load balancer lb1 has nowhere to send requests.'])
  })
})
