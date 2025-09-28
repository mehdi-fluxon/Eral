import swaggerJSDoc from 'swagger-jsdoc'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LuxonAI API',
      version: '1.0.0',
      description: 'Intelligent contact management system - Building stronger relationships through AI',
      contact: {
        name: 'LuxonAI Support',
        email: 'support@luxonai.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: '{protocol}://{host}',
        description: 'Dynamic server',
        variables: {
          protocol: {
            default: 'https',
            enum: ['http', 'https']
          },
          host: {
            default: 'api.luxonai.com'
          }
        }
      }
    ],
    components: {
      schemas: {
        Contact: {
          type: 'object',
          required: ['id', 'name', 'email', 'cadence', 'lastTouchDate'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the contact',
              example: 'cmg39beol0001itk77arer899'
            },
            name: {
              type: 'string',
              description: 'Full name of the contact',
              example: 'John Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the contact',
              example: 'john@example.com'
            },
            jobTitle: {
              type: 'string',
              nullable: true,
              description: 'Job title or position',
              example: 'CEO'
            },
            linkedinUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'LinkedIn profile URL',
              example: 'https://linkedin.com/in/johnsmith'
            },
            referrer: {
              type: 'string',
              nullable: true,
              description: 'Who referred this contact',
              example: 'Jane Doe'
            },
            labels: {
              type: 'string',
              nullable: true,
              description: 'Comma-separated list of labels',
              example: 'hot-lead, vip, decision-maker'
            },
            cadence: {
              type: 'string',
              description: 'Follow-up frequency',
              enum: ['1_DAY', '2_DAYS', '3_DAYS', '5_DAYS', '7_DAYS', '2_WEEKS', '3_WEEKS', '1_MONTH', '2_MONTHS', '3_MONTHS', '6_MONTHS', '9_MONTHS', '12_MONTHS', '18_MONTHS', '24_MONTHS'],
              example: '3_MONTHS'
            },
            lastTouchDate: {
              type: 'string',
              format: 'date-time',
              description: 'Last contact date',
              example: '2024-01-15T10:30:00Z'
            },
            nextReminderDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Next reminder date',
              example: '2024-04-15T10:30:00Z'
            },
            reminderStatus: {
              type: 'string',
              enum: ['OVERDUE', 'DUE_TODAY', 'UPCOMING', 'NO_REMINDER'],
              description: 'Current reminder status'
            },
            generalNotes: {
              type: 'string',
              nullable: true,
              description: 'General notes about the contact',
              example: 'Interested in enterprise solution'
            },
            customFields: {
              type: 'object',
              nullable: true,
              description: 'Custom fields as key-value pairs',
              additionalProperties: {
                type: 'string'
              }
            },
            companies: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ContactCompany'
              }
            },
            teamMembers: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ContactTeamMember'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Contact creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Company: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the company'
            },
            name: {
              type: 'string',
              description: 'Company name',
              example: 'Acme Corporation'
            },
            website: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'Company website',
              example: 'https://acme.com'
            },
            industry: {
              type: 'string',
              nullable: true,
              description: 'Industry sector',
              example: 'Technology'
            },
            size: {
              type: 'string',
              nullable: true,
              description: 'Company size',
              example: '100-500 employees'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TeamMember: {
          type: 'object',
          required: ['id', 'name', 'email'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the team member'
            },
            name: {
              type: 'string',
              description: 'Team member name',
              example: 'Alice Johnson'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Team member email',
              example: 'alice@company.com'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Note: {
          type: 'object',
          required: ['id', 'contactId', 'teamMemberId', 'content'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the note'
            },
            contactId: {
              type: 'string',
              description: 'Associated contact ID'
            },
            teamMemberId: {
              type: 'string',
              description: 'Team member who created the note'
            },
            content: {
              type: 'string',
              description: 'Note content with rich text support',
              example: '**Important**: Follow up after Q4 planning'
            },
            teamMember: {
              $ref: '#/components/schemas/TeamMember'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Interaction: {
          type: 'object',
          required: ['id', 'contactId', 'teamMemberId', 'type', 'content'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the interaction'
            },
            contactId: {
              type: 'string',
              description: 'Associated contact ID'
            },
            teamMemberId: {
              type: 'string',
              description: 'Team member who logged the interaction'
            },
            type: {
              type: 'string',
              enum: ['EMAIL', 'CALL', 'MEETING', 'LINKEDIN', 'FOLLOWUP', 'PROPOSAL', 'OTHER'],
              description: 'Type of interaction'
            },
            subject: {
              type: 'string',
              nullable: true,
              description: 'Interaction subject/title',
              example: 'Q4 Planning Discussion'
            },
            content: {
              type: 'string',
              description: 'Interaction details',
              example: 'Discussed quarterly planning and budget allocation'
            },
            outcome: {
              type: 'string',
              nullable: true,
              description: 'Interaction outcome or next steps',
              example: 'Scheduled follow-up meeting for next week'
            },
            interactionDate: {
              type: 'string',
              format: 'date-time',
              description: 'When the interaction occurred'
            },
            teamMember: {
              $ref: '#/components/schemas/TeamMember'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ContactCompany: {
          type: 'object',
          properties: {
            company: {
              $ref: '#/components/schemas/Company'
            }
          }
        },
        ContactTeamMember: {
          type: 'object',
          properties: {
            teamMember: {
              $ref: '#/components/schemas/TeamMember'
            }
          }
        },
        PaginatedContacts: {
          type: 'object',
          properties: {
            contacts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Contact'
              }
            },
            pagination: {
              $ref: '#/components/schemas/Pagination'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number',
              example: 1
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
              example: 50
            },
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 150
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 3
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page'
            }
          }
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalContacts: {
              type: 'integer',
              description: 'Total number of contacts',
              example: 150
            },
            overdueContacts: {
              type: 'integer',
              description: 'Number of overdue contacts',
              example: 5
            },
            dueTodayContacts: {
              type: 'integer',
              description: 'Number of contacts due today',
              example: 3
            },
            dueThisWeekContacts: {
              type: 'integer',
              description: 'Number of contacts due this week',
              example: 12
            }
          }
        },
        TimelineItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            type: {
              type: 'string',
              enum: ['note', 'interaction']
            },
            content: {
              type: 'string'
            },
            teamMember: {
              $ref: '#/components/schemas/TeamMember'
            },
            date: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Contact not found'
            }
          }
        },
        CreateContactRequest: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              description: 'Contact name',
              example: 'John Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Contact email',
              example: 'john@example.com'
            },
            jobTitle: {
              type: 'string',
              description: 'Job title',
              example: 'CEO'
            },
            linkedinUrl: {
              type: 'string',
              format: 'uri',
              description: 'LinkedIn profile URL'
            },
            referrer: {
              type: 'string',
              description: 'Who referred this contact'
            },
            labels: {
              type: 'string',
              description: 'Comma-separated labels',
              example: 'hot-lead, vip'
            },
            cadence: {
              type: 'string',
              enum: ['1_DAY', '2_DAYS', '3_DAYS', '5_DAYS', '7_DAYS', '2_WEEKS', '3_WEEKS', '1_MONTH', '2_MONTHS', '3_MONTHS', '6_MONTHS', '9_MONTHS', '12_MONTHS', '18_MONTHS', '24_MONTHS'],
              default: '3_MONTHS'
            },
            lastTouchDate: {
              type: 'string',
              format: 'date',
              description: 'Last contact date (YYYY-MM-DD)'
            },
            generalNotes: {
              type: 'string',
              description: 'General notes'
            },
            customFields: {
              type: 'object',
              description: 'Custom fields as key-value pairs',
              additionalProperties: {
                type: 'string'
              }
            },
            companyIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of company IDs to associate'
            },
            teamMemberIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of team member IDs to associate'
            }
          }
        },
        CreateNoteRequest: {
          type: 'object',
          required: ['content', 'teamMemberId'],
          properties: {
            content: {
              type: 'string',
              description: 'Note content with rich text support',
              example: '**Important**: Client interested in enterprise plan'
            },
            teamMemberId: {
              type: 'string',
              description: 'ID of team member creating the note'
            }
          }
        },
        CreateInteractionRequest: {
          type: 'object',
          required: ['type', 'content', 'teamMemberId'],
          properties: {
            type: {
              type: 'string',
              enum: ['EMAIL', 'CALL', 'MEETING', 'LINKEDIN', 'FOLLOWUP', 'PROPOSAL', 'OTHER'],
              description: 'Type of interaction'
            },
            subject: {
              type: 'string',
              description: 'Interaction subject'
            },
            content: {
              type: 'string',
              description: 'Interaction details'
            },
            outcome: {
              type: 'string',
              description: 'Interaction outcome'
            },
            interactionDate: {
              type: 'string',
              format: 'date',
              description: 'Interaction date (YYYY-MM-DD)'
            },
            teamMemberId: {
              type: 'string',
              description: 'ID of team member logging the interaction'
            },
            updateLastTouch: {
              type: 'boolean',
              default: true,
              description: 'Whether to update contact last touch date and recalculate reminder'
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad request - validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Contacts',
        description: 'Contact management operations'
      },
      {
        name: 'Companies',
        description: 'Company management operations'
      },
      {
        name: 'Team Members',
        description: 'Team member management operations'
      },
      {
        name: 'Notes',
        description: 'Contact notes operations'
      },
      {
        name: 'Interactions',
        description: 'Contact interaction logging'
      },
      {
        name: 'Dashboard',
        description: 'Dashboard and analytics'
      },
      {
        name: 'Timeline',
        description: 'Contact activity timeline'
      }
    ]
  },
  apis: [
    './app/api/**/*.ts',
    './app/api/**/*.js',
    './app/api/**/route.ts'
  ], // Paths to files containing OpenAPI definitions
}

export const specs = swaggerJSDoc(options)