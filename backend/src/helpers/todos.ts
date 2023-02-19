import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'


// TODO: Implement businessLogic
const logger = createLogger('todos')
const attachmentUtils =  new AttachmentUtils()
const todosAccess = new TodosAccess() 

// create todo business logic
export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info('get todos for user', userId)
    const items = await todosAccess.getAllTodos(userId)
  
    for (let item of items) {
      if (!!item['attachmentUrl'])
        item['attachmentUrl'] = attachmentUtils.getAttachmentURL(item['attachmentUrl'])
    }
  
    return items
  }
  
  export async function createTodo(
    userId: string,
    createTodoRequest: CreateTodoRequest,
  ): Promise<TodoItem> {
    logger.info('create todo for user', userId)
    const todoId = uuid.v4()
  
    return await todosAccess.createTodo({
      userId,
      todoId,
      createdAt: new Date().toISOString(),
      ...createTodoRequest
    } as TodoItem)
  }
  
  export async function deleteTodo(todoId: string, userId: string, ): Promise<void> {
    logger.info('delete todo', todoId)
    // Delete attachment object from S3
    await attachmentUtils.deleteAttachmentObject(todoId)
    await todosAccess.deleteTodo(todoId, userId)
  }
  
  export async function updateTodo(todoId: string, updatedTodo: UpdateTodoRequest, userId: string): Promise<void> {
    const validTodo = await todosAccess.getTodo(userId, todoId)
  
    if (!validTodo) {
      throw new createError.NotFound("Todo Not Found")
    }
  
    return await todosAccess.updateTodo(todoId, updatedTodo, userId)
  }
  
  
  export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string> {
    logger.info('create attachment url', todoId)
    const validTodo = await todosAccess.getTodo(todoId, userId)
  
    if (!validTodo) {
      throw new createError.NotFound("Todo Not Found")
    }
  
    const uploadUrl = attachmentUtils.getAttachmentUploadURL(todoId)
    await todosAccess.updateAttachment(userId, todoId)
    return uploadUrl
  }
  