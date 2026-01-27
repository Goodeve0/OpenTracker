// src/types/koa.d.ts
import * as Koa from 'koa'
import { TokenPayload } from '../utils/jwt'

declare module 'koa' {
  interface State {
    user: TokenPayload
  }
}
