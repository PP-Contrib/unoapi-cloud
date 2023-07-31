import { Request, Response } from 'express'

import { Outgoing } from '../services/outgoing'
import { Incoming } from '../services/incoming'

import { getConfig } from '../services/config'
import { Client, getClient } from '../services/client'

import { clients } from '../services/client_baileys'
import { onNewLogin } from '../services/new_login'

import logger from '../services/logger'

export class SessionController {

  private getConfig: getConfig
  private getClient: getClient
  private incoming: Incoming
  private outgoing: Outgoing

  constructor(incoming: Incoming, outgoing: Outgoing, getConfig: getConfig, getClient: getClient) {
    this.incoming = incoming
    this.outgoing = outgoing    
    this.getConfig = getConfig
    this.getClient = getClient
  }  

  public async info(req: Request, res: Response) {
    logger.debug('info method', req.method)
    logger.debug('info headers', req.headers)
    logger.debug('info params', req.params)
    logger.debug('info body', JSON.stringify(req.body, null, ' '))
    logger.debug('info query', JSON.stringify(req.query, null, ' '))    
    const { phone } = req.params
    try {
      if (clients && clients.has(phone)) {
        const client = clients.get(phone) as Client
        const config = await this.getConfig(phone)
        return res.status(200).json({ 
          info: client.getInfo(),
          status: client.getStatus(),
          webhooks: config.webhooks
        })
      }
      return res.status(404).json({ status: 'error', message: `${phone} not found` })
    } catch (e) {
      return res.status(500).json({ status: 'error', message: e.message })
    }
  }

  public async create(req: Request, res: Response) {
    logger.debug('create method', req.method)
    logger.debug('create headers', req.headers)
    logger.debug('create params', req.params)
    logger.debug('create body', JSON.stringify(req.body, null, ' '))
    logger.debug('create query', JSON.stringify(req.query, null, ' '))    
    const { phone } = req.params
    try {
      const client: Client = await this.getClient({
        phone,
        incoming: this.incoming,
        outgoing: this.outgoing,
        getConfig: this.getConfig,
        onNewLogin: onNewLogin(this.outgoing),
      })
      if (client) {
        return res.status(200).json({ 
          info: client.getInfo(),
          status: client.getStatus(),
        })
      }
      return res.status(400).json({ status: 'error', message: `${phone} could not create` })
    } catch (e) {
      return res.status(500).json({ status: 'error', message: e.message })
    }
  }

  public async delete(req: Request, res: Response) {
    logger.debug('delete method', req.method)
    logger.debug('delete headers', req.headers)
    logger.debug('delete params', req.params)
    logger.debug('delete body', JSON.stringify(req.body, null, ' '))
    logger.debug('delete query', JSON.stringify(req.query, null, ' '))    
    const { phone } = req.params
    try {
      if (clients && clients.has(phone)) {
        const client = clients.get(phone) as Client
        if (client) {
          await client.disconnect()
          return res.status(204).send()          
        }
      }
      return res.status(404).json({ status: 'error', message: `${phone} not found` })
    } catch (e) {
      return res.status(500).json({ status: 'error', message: e.message })
    }
  }

}