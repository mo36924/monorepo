import { expect } from "@jest/globals";
import * as babel from "@mo36924/jest-snapshot-serializer-babel";
import * as graphql from "@mo36924/jest-snapshot-serializer-graphql";
import * as preact from "@mo36924/jest-snapshot-serializer-preact";
import * as prettier from "@mo36924/jest-snapshot-serializer-prettier";
import * as raw from "@mo36924/jest-snapshot-serializer-raw";
import * as sql from "@mo36924/jest-snapshot-serializer-sql";

expect.addSnapshotSerializer(babel);
expect.addSnapshotSerializer(graphql);
expect.addSnapshotSerializer(preact);
expect.addSnapshotSerializer(prettier);
expect.addSnapshotSerializer(raw);
expect.addSnapshotSerializer(sql);
