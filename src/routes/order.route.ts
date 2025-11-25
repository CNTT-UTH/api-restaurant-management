import { ManagerRoom } from '@/constants/type'
import { createOrdersController, getOrdersController, getOrderDetailController, updateOrderController } from '@/controllers/order.controller'
import { requireEmployeeHook, requireLoginedHook, requireOwnerHook } from '@/hooks/auth.hooks'
import { CreateOrdersResType, CreateOrdersBodyType, CreateOrdersRes, CreateOrdersBody, GetOrdersResType, GetOrdersQueryParamsType, GetOrdersRes, GetOrdersQueryParams, GetOrderDetailResType, OrderParamType, GetOrderDetailRes, OrderParam, UpdateOrderResType, UpdateOrderBodyType, UpdateOrderRes, UpdateOrderBody} from '@/validation/order.schema'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function orderRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.addHook(
    'preValidation',
    fastify.auth([requireLoginedHook, [requireOwnerHook, requireEmployeeHook]], {
      relation: 'and'
    })
  )
  fastify.post<{ Reply: CreateOrdersResType; Body: CreateOrdersBodyType }>(
    '/',
    {
      schema: {
        response: {
          200: CreateOrdersRes
        },
        body: CreateOrdersBody
      }
    },
    async (request, reply) => {
      const { socketId, orders } = await createOrdersController(
        request.decodedAccessToken?.userId as number,
        request.body
      )
      if (socketId) {
        fastify.io.to(ManagerRoom).to(socketId).emit('new-order', orders)
      } else {
        fastify.io.to(ManagerRoom).emit('new-order', orders)
      }
      reply.send({
        message: `Tạo thành công ${orders.length} đơn hàng cho khách hàng`,
        data: orders as CreateOrdersResType['data']
      })
    }
  )
  fastify.get<{ Reply: GetOrdersResType; Querystring: GetOrdersQueryParamsType }>(
    '/',
    {
      schema: {
        response: {
          200: GetOrdersRes
        },
        querystring: GetOrdersQueryParams
      }
    },
    async (request, reply) => {
      const result = await getOrdersController({
        fromDate: request.query.fromDate,
        toDate: request.query.toDate
      })
      reply.send({
        message: 'Lấy danh sách đơn hàng thành công',
        data: result as GetOrdersResType['data']
      })
    }
  )

  fastify.get<{ Reply: GetOrderDetailResType; Params: OrderParamType }>(
    '/:orderId',
    {
      schema: {
        response: {
          200: GetOrderDetailRes
        },
        params: OrderParam
      }
    },
    async (request, reply) => {
      const result = await getOrderDetailController(request.params.orderId)
      reply.send({
        message: 'Lấy đơn hàng thành công',
        data: result as GetOrderDetailResType['data']
      })
    }
  )

  fastify.put<{ Reply: UpdateOrderResType; Body: UpdateOrderBodyType; Params: OrderParamType }>(
    '/:orderId',
    {
      schema: {
        response: {
          200: UpdateOrderRes
        },
        body: UpdateOrderBody,
        params: OrderParam
      }
    },
    async (request, reply) => {
      const result = await updateOrderController(request.params.orderId, {
        ...request.body,
        orderHandlerId: request.decodedAccessToken?.userId as number
      })
      if (result.socketId) {
        fastify.io.to(result.socketId).to(ManagerRoom).emit('update-order', result.order)
      } else {
        fastify.io.to(ManagerRoom).emit('update-order', result.order)
      }
      reply.send({
        message: 'Cập nhật đơn hàng thành công',
        data: result.order as UpdateOrderResType['data']
      })
    }
  )
}
