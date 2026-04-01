import { Logger, ConsoleLogger } from '../helpers/logger'

class BaseService {
  logger: Logger = new ConsoleLogger()
  constructor() {}
}

export { BaseService }
