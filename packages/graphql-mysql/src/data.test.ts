import { expect, test } from "@jest/globals";
import { raw } from "@mo36924/jest-snapshot-serializer-raw";
import { createTestDataQuery } from "./data";
import { schema } from "./setup";

test("createTestDataQuery", () => {
  expect(raw(createTestDataQuery(schema))).toMatchInlineSnapshot(`
    set foreign_key_checks=0;
    insert into \`Class\` (\`id\`,\`version\`,\`createdAt\`,\`updatedAt\`,\`isDeleted\`,\`name\`) values 
    (X'0000000000004000a000000000000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,'name-1'),
    (X'0000000000004000a000000000000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,'name-2'),
    (X'0000000000004000a000000000000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,'name-3');
    insert into \`Club\` (\`id\`,\`version\`,\`createdAt\`,\`updatedAt\`,\`isDeleted\`,\`name\`) values 
    (X'0000000000004000a000000100000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,'name-1'),
    (X'0000000000004000a000000100000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,'name-2'),
    (X'0000000000004000a000000100000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,'name-3');
    insert into \`ClubToUser\` (\`id\`,\`version\`,\`createdAt\`,\`updatedAt\`,\`isDeleted\`,\`clubId\`,\`userId\`) values 
    (X'0000000000004000a000000200000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000001'),
    (X'0000000000004000a000000200000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000002'),
    (X'0000000000004000a000000200000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000003'),
    (X'0000000000004000a000000200000004',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000004'),
    (X'0000000000004000a000000200000005',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000005'),
    (X'0000000000004000a000000200000006',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000006'),
    (X'0000000000004000a000000200000007',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000007'),
    (X'0000000000004000a000000200000008',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000008'),
    (X'0000000000004000a000000200000009',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000009'),
    (X'0000000000004000a000000200000010',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000001'),
    (X'0000000000004000a000000200000011',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000002'),
    (X'0000000000004000a000000200000012',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000003'),
    (X'0000000000004000a000000200000013',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000004'),
    (X'0000000000004000a000000200000014',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000005'),
    (X'0000000000004000a000000200000015',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000006'),
    (X'0000000000004000a000000200000016',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000007'),
    (X'0000000000004000a000000200000017',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000008'),
    (X'0000000000004000a000000200000018',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000009'),
    (X'0000000000004000a000000200000019',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000001'),
    (X'0000000000004000a000000200000020',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000002'),
    (X'0000000000004000a000000200000021',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000003'),
    (X'0000000000004000a000000200000022',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000004'),
    (X'0000000000004000a000000200000023',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000005'),
    (X'0000000000004000a000000200000024',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000006'),
    (X'0000000000004000a000000200000025',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000001',X'0000000000004000a000000400000007'),
    (X'0000000000004000a000000200000026',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000002',X'0000000000004000a000000400000008'),
    (X'0000000000004000a000000200000027',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000100000003',X'0000000000004000a000000400000009');
    insert into \`Profile\` (\`id\`,\`version\`,\`createdAt\`,\`updatedAt\`,\`isDeleted\`,\`age\`,\`userId\`) values 
    (X'0000000000004000a000000300000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000001'),
    (X'0000000000004000a000000300000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000002'),
    (X'0000000000004000a000000300000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000003'),
    (X'0000000000004000a000000300000004',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000004'),
    (X'0000000000004000a000000300000005',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000005'),
    (X'0000000000004000a000000300000006',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000006'),
    (X'0000000000004000a000000300000007',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000007'),
    (X'0000000000004000a000000300000008',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000008'),
    (X'0000000000004000a000000300000009',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,0,X'0000000000004000a000000400000009');
    insert into \`User\` (\`id\`,\`version\`,\`createdAt\`,\`updatedAt\`,\`isDeleted\`,\`classId\`,\`name\`) values 
    (X'0000000000004000a000000400000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000001','name-1'),
    (X'0000000000004000a000000400000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000002','name-2'),
    (X'0000000000004000a000000400000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000003','name-3'),
    (X'0000000000004000a000000400000004',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000001','name-4'),
    (X'0000000000004000a000000400000005',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000002','name-5'),
    (X'0000000000004000a000000400000006',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000003','name-6'),
    (X'0000000000004000a000000400000007',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000001','name-7'),
    (X'0000000000004000a000000400000008',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000002','name-8'),
    (X'0000000000004000a000000400000009',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',false,X'0000000000004000a000000000000003','name-9');
    set foreign_key_checks=1;

  `);
});
