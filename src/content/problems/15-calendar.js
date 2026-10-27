export default {
  id: "calendar",
  title: "Design a Shared Calendar",
  difficulty: "easy",
  minutes: 10,
  tags: ["data-model", "consistency", "queues"],
  prompt: "A calendar app for 30 million users supports events, invites and reminders. People view their week, create events with attendees, and get a notification 10 minutes before each event. Recurring events like 'every Monday' are common.",
  requirements: {
    functional: [
      "Create, edit and delete events, including recurring ones",
      "Invite attendees who can accept or decline",
      "Show a user's calendar for a date range",
      "Send reminders before events"
    ],
    nonFunctional: ["Week view loads in under 300 ms", "Reminders fire on time, once", "Correct across time zones"]
  },
  quiz: [
    {
      q: "How to store 'every Monday at 9am'?",
      choices: [
        "One row per occurrence forever",
        "One row with a recurrence rule, expanded when read",
        "A separate table per weekday",
        "Only the next occurrence"
      ],
      answer: 1,
      why: "Store the rule (like RRULE) and expand into a date range on read; store exceptions separately.",
      tag: "data-model"
    },
    {
      q: "Store event times as?",
      choices: ["Local time text", "Unix seconds in the viewer's zone", "Only the date", "UTC plus the event's time zone"],
      answer: 3,
      why: "UTC for ordering and the original zone for correct recurring times across daylight saving changes.",
      tag: "data-model"
    },
    {
      q: "One Monday of a weekly meeting moves. How?",
      choices: ["Edit the rule", "Delete the series", "Store an exception row for that date", "Make a new calendar"],
      answer: 2,
      why: "An override for one instance keeps the rule intact for all other weeks.",
      tag: "data-model"
    },
    {
      q: "Query for 'my week' needs which index?",
      choices: ["(user_id, start_time) on attendee rows", "event title", "location", "created_at only"],
      answer: 0,
      why: "Looking up a user's events by time range is the main read; index exactly that.",
      tag: "data-model"
    },
    {
      q: "How to fire millions of reminders on time?",
      choices: [
        "A cron that scans every event each minute",
        "The phone checks every second",
        "Email batch at midnight",
        "A delayed queue or time-bucketed schedule of reminder jobs"
      ],
      answer: 3,
      why: "Schedule each reminder into a time bucket; workers pull the current bucket and send.",
      tag: "queues"
    },
    {
      q: "A reminder worker crashes mid-batch. Avoid duplicates by?",
      choices: [
        "Re-sending everything",
        "Marking each reminder sent with an idempotent update",
        "Skipping the batch",
        "Restarting the server"
      ],
      answer: 1,
      why: "Mark sent with a conditional update so a retried batch skips reminders already delivered.",
      tag: "reliability"
    },
    {
      q: "Organizer edits an event with 50 attendees. Attendees see it via?",
      choices: ["Shared event row plus per-attendee status rows", "50 copies of the event", "Email only", "A cron job"],
      answer: 0,
      why: "One event row referenced by attendee rows means one edit shows up for everyone.",
      tag: "data-model"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Calendar App", kind: "client", x: 180, y: 50 },
      { id: "api", label: "Calendar API", kind: "service", x: 180, y: 126 },
      { id: "db", label: "Events DB", kind: "db", x: 100, y: 202 },
      { id: "cache", label: "Week Cache", kind: "cache", x: 260, y: 202 },
      { id: "sched", label: "Reminder Sched", kind: "db", x: 180, y: 278 },
      { id: "worker", label: "Reminder Wkr", kind: "worker", x: 180, y: 354 },
      { id: "push", label: "Push / Email", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "db" },
      { from: "api", to: "cache" },
      { from: "api", to: "sched", label: "schedule" },
      { from: "worker", to: "sched", label: "poll" },
      { from: "worker", to: "push" }
    ],
    steps: [
      {
        add: ["client", "api", "db"],
        caption: "The API stores events, recurrence rules, exceptions and attendee status in a relational DB."
      },
      {
        add: ["cache"],
        caption: "Expanded week views are cached per user and cleared when any of their events change."
      },
      { add: ["sched"], caption: "Each upcoming occurrence's reminder is written into a time-bucketed schedule." },
      {
        add: ["worker", "push"],
        caption: "Workers pick up the current minute's bucket and send push or email reminders, marking each sent."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Events with recurrence and invites, range views, and on-time reminders across time zones."
    },
    {
      heading: "Data model",
      body: "events(id, organizer, start_utc, duration, tz, rrule), event_exceptions(event_id, date, override), attendees(event_id, user_id, status). Index attendees by user plus start."
    },
    {
      heading: "Reading",
      body: "Fetch single events and recurring series overlapping the range, expand rules in the event's time zone, apply exceptions, convert to the viewer's zone. Cache the result."
    },
    {
      heading: "Reminders",
      body: "When an event is created or changes, compute the next reminders (a rolling few days for recurring ones) and put them in time buckets. Workers process each minute's bucket."
    },
    {
      heading: "Correctness",
      body: "Reminders are marked sent with a conditional update so retries don't double-send. Edits cancel and reschedule affected reminders."
    }
  ],
  keyPoints: [
    "Stores recurrence as a rule plus exceptions",
    "Stores UTC plus original time zone",
    "Indexes attendee rows by user and start time",
    "Schedules reminders with time buckets or delayed queue",
    "Makes reminder sending idempotent",
    "Reschedules reminders when events change",
    "Shares one event row across attendees"
  ],
  cardIds: ["delayed-delivery", "idempotency-key", "b-tree-index"]
};
