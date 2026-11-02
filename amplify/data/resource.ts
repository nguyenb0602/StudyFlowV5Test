import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Course: a.model({
    name: a.string().required(),
    department: a.string().required(),
    code: a.string().required(),
    section: a.string().required(),
    professor: a.string().required(),
    color: a.string().required(),
    colorSource: a.string(),
  }).authorization(allow => [allow.owner()]),

  Event: a.model({
    title: a.string().required(),
    type: a.string().required(),
    date: a.date().required(),
    time: a.time().required(),
    courseId: a.id(),
  }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});