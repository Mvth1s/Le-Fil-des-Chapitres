import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    /*
    | Outside debug mode the parent handler answers { message: error.message },
    | and for an unexpected error (5xx) that message can be internal (SQL,
    | driver, file path). It is replaced by a generic body; the full error is
    | still logged by report(). 4xx errors (404, 422...) keep their useful body.
    */
    const httpError = this.toHttpError(error)
    if (!this.debug && httpError.status >= 500) {
      return ctx.response.status(httpError.status).send({ message: 'Internal server error' })
    }
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
