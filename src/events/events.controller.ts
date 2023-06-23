import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Like, MoreThan, Repository } from 'typeorm';
import { CreateEventDto } from './input/create-event.dto';
// import { Event } from './event.entity';
import { UpdateEventDto } from './input/update-event.dto';
// import { Attendee } from './attendee.entity';
import { EventsService } from './event.service';
import { ListEvents } from './input/list.events';
import { CurrentUser } from './../auth/current-user.decorator';
import { User } from './../auth/user.entity';
import { AuthGuardJwt } from './../auth/auth-guard.jwt';

@Controller('/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    // @InjectRepository(Event)
    // private readonly repository: Repository<Event>,
    // @InjectRepository(Attendee)
    // private readonly attendeeRepository: Repository<Attendee>,
    private readonly eventsService: EventsService,
  ) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filter: ListEvents) {
    this.logger.debug(filter);
    const events =
      await this.eventsService.getEventsWithAttendeeCountFilteredPaginated(
        filter,
        {
          total: true,
          currentPage: filter.page,
          limit: 3,
        },
      );
    return events;
  }

  // @Get('/practice')
  // async practice() {
  //   return await this.repository.find({
  //     select: ['id', 'when'],
  //     where: [
  //       {
  //         id: MoreThan(3),
  //         when: MoreThan(new Date('2021-02-12T13:00:00')),
  //       },
  //       {
  //         description: Like('%meet%'),
  //       },
  //     ],
  //     take: 2,
  //     order: {
  //       id: 'DESC',
  //     },
  //   });
  // }

  // @Get('practice2')
  // async practice2() {
  //   //First relation - does not return the attendees list of an event
  //   // const event = await this.repository.findOneBy({ id: 1 });
  //   // const attendee = new Attendee();
  //   // attendee.name = 'John Doe ';
  //   // attendee.event = event;
  //   // await this.attendeeRepository.save(attendee);
  //   // return event;

  //   //Second relation
  //   // const event = new Event();
  //   // event.id = 1;
  //   // const attendee = new Attendee();
  //   // attendee.name = 'John Doe II';
  //   // attendee.event = event;
  //   // await this.attendeeRepository.save(attendee);
  //   // return event;

  //   //Third relation - cascade
  //   const event = await this.repository.findOne({
  //     where: {
  //       id: 1,
  //     },
  //     relations: {
  //       attendees: true,
  //     },
  //   });

  //   const attendee = new Attendee();
  //   attendee.name = 'John Doe III';
  //   event.attendees.push(attendee);
  //   await this.repository.save(event);

  //   return event;
  // }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    //const event = await this.repository.findOneBy({ id: id });
    const event = this.eventsService.getEvent(id);
    if (!event) {
      throw new NotFoundException();
    }
    return event;
  }

  @Post()
  @UseGuards(AuthGuardJwt)
  async create(@Body() input: CreateEventDto, @CurrentUser() user: User) {
    return await this.eventsService.createEvent(input, user);
  }

  // Create new ValidationPipe to specify validation group inside @Body
  // new ValidationPipe({ groups: ['update'] })
  @Patch(':id')
  @UseGuards(AuthGuardJwt)
  async update(
    @Param('id') id,
    @Body() input: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    const event = await this.eventsService.getEvent(id);
    if (!event) {
      throw new NotFoundException();
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException(null, 'Not allowed to update this event');
    }

    return await this.eventsService.updateEvent(event, input);
  }

  @Delete(':id')
  @UseGuards(AuthGuardJwt)
  @HttpCode(204)
  async remove(@Param('id') id, @CurrentUser() user: User) {
    const event = await this.eventsService.getEvent(id);
    if (!event) {
      throw new NotFoundException();
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException(null, 'Not allowed to delete this event');
    }
    await this.eventsService.deleteEvent(id);
  }
}
