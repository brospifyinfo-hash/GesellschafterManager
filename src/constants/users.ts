import { User } from '@/types'

export const USERS: User[] = [
  {
    code: 'DK',
    name: 'Devid',
    password: '8789',
    isAdmin: true,
    color: 'devid',
  },
  {
    code: 'LS',
    name: 'Lara',
    password: '0000',
    isAdmin: false,
    color: 'lukas',
  },
  {
    code: 'DF',
    name: 'Dennis',
    password: '9281',
    isAdmin: false,
    color: 'dennis',
  },
  {
    code: 'EM',
    name: 'Eren',
    password: '0000',
    isAdmin: false,
    color: 'david',
  },
  {
    code: 'ZEIT',
    name: 'Zeit',
    password: '1108',
    isAdmin: false,
    color: 'devid',
    isTimeAccount: true,
  },
]

export const USER_CODES = ['DK', 'LS', 'DF', 'EM'] as const
export type UserCode = typeof USER_CODES[number]
