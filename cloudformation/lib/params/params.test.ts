import { Source } from './params'

describe('Get env variables from different sources', () => {
  it('Gets from local sources', () => {
    const params = new Source()

    expect(params.web).toContain('DATABASE_URL')

    expect(params.api).toContain('SECRET_KEY')
  })

  it('Gets from remote sources', () => {})
})
