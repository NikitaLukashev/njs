import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse, ApiOperationOptions } from '@nestjs/swagger';

@ApiTags('Core')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Hello World',
    description: 'Returns a simple greeting message to verify the API is working'
  } as ApiOperationOptions)
  @ApiResponse({
    status: 200,
    description: 'Successfully returned greeting message',
    schema: {
      type: 'string',
      example: 'Hello World!'
    }
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
