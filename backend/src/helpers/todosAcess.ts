import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {

    constructor(
      private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
      private readonly todosTable = process.env.TODOS_TABLE
    ) { }
  
  
    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger.info(`Creating todo item with id ${todo.todoId}`)
        await this.docClient
        .put({
            TableName: this.todosTable,
            Item: todo
        })
        .promise()
        logger.info(`Created todo item with id ${todo.todoId}`)
        return todo
    }
      
    async deleteTodo(todoId: string, userId: string): Promise<void> {
        logger.info(`user ${userId} deleting todo item with id ${todoId}`)
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: { userId, todoId }
        }).promise()
        logger.info(`user ${userId} successfully deleted todo item with id ${todoId}`)
    }
  
    async getAllTodos(userId: string): Promise<TodoItem[]> {
        logger.info(`Get all todos for user ${userId}`)
        const result = await this.docClient
        .query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        })
        .promise()
        logger.info(`${result.Items.length} todos retrieved for user with id ${userId}`)
      return result.Items as TodoItem[]
    }
  

    // TODO: Confirm use case
    async getTodo(todoId: string, userId: string): Promise<TodoItem> {
        logger.info(`Get an instance of a todo item with id ${todoId} for user with id ${userId}`)
        const result = await this.docClient
        .get({
            TableName: this.todosTable,
            Key: { userId, todoId }
        })
        .promise()
        logger.info(`Todo item with id ${todoId} retrieved successfull by user with id ${userId}`)

        return result.Item as TodoItem
    }

    async updateTodo(todoId: string, updatedTodo: TodoUpdate, userId: string): Promise<void> {
        logger.info(`Update an instance of a todo item with id ${todoId} for user with id ${userId}`)
        await this.docClient.update({
            TableName: this.todosTable,
            Key: { userId, todoId },
            UpdateExpression: "set #name = :n, dueDate=:dueDate, done=:done",
            ExpressionAttributeValues: {
                ":n": updatedTodo.name,
                ":dueDate": updatedTodo.dueDate,
                ":done": updatedTodo.done
            },
            ExpressionAttributeNames: { '#name': 'name' },
            ReturnValues: "NONE"
        }).promise()
        logger.info(`Todo item with id ${todoId} updated successfully by user with id ${userId}`)
    }
  
    async updateAttachment(userId: string, todoId: string, ): Promise<void> {
        logger.info(`Attachment named ${todoId} updated successfully by user with id ${userId}`)
        await this.docClient.update({
            TableName: this.todosTable,
            Key: { userId, todoId },
            UpdateExpression: "set attachmentUrl=:todoId",
            ExpressionAttributeValues: {
                ":todoId": todoId
            },
            ReturnValues: "NONE"
        }).promise()
    }
  }
  