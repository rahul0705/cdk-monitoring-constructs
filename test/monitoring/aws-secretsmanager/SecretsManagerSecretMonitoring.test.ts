import { App, Duration, Stack, cx_api } from "monocdk";
import { Template } from "monocdk/assertions";
import { Secret } from "monocdk/aws-secretsmanager";

import {
  AlarmWithAnnotation,
  SecretsManagerMetricsPublisher,
  SecretsManagerSecretMonitoring,
} from "../../../lib";
import { TestMonitoringScope } from "../TestMonitoringScope";

test("snapshot test", () => {
  const stack = new Stack();
  stack.node.setContext(cx_api.SECRETS_MANAGER_PARSE_OWNED_SECRET_NAME, true);

  const scope = new TestMonitoringScope(stack, "Scope");

  const secret1 = new Secret(stack, "Secret1");
  const secret2 = new Secret(stack, "Secret2");
  const secret3 = new Secret(stack, "Secret3");

  let numAlarmsCreated = 0;

  new SecretsManagerSecretMonitoring(scope, {
    secret: secret1,
    addDaysSinceLastChangeAlarm: {
      Warning: {
        maxDaysSinceUpdate: 30,
        period: Duration.days(1),
      },
      Critical: {
        maxDaysSinceUpdate: 60,
        period: Duration.days(1),
      },
    },
    useCreatedAlarms: {
      consume(alarms: AlarmWithAnnotation[]) {
        numAlarmsCreated += alarms.length;
      },
    },
  });

  new SecretsManagerSecretMonitoring(scope, {
    secret: secret2,
    addDaysSinceLastRotationAlarm: {
      Warning: {
        maxDaysSinceUpdate: 30,
        period: Duration.days(1),
      },
    },
    useCreatedAlarms: {
      consume(alarms: AlarmWithAnnotation[]) {
        numAlarmsCreated += alarms.length;
      },
    },
  });

  new SecretsManagerSecretMonitoring(scope, {
    secret: secret3,
    addDaysSinceLastChangeAlarm: {
      Warning: {
        maxDaysSinceUpdate: 30,
        period: Duration.days(1),
      },
    },
    showLastRotationWidget: true,
    useCreatedAlarms: {
      consume(alarms: AlarmWithAnnotation[]) {
        numAlarmsCreated += alarms.length;
      },
    },
  });

  expect(numAlarmsCreated).toStrictEqual(4);
  expect(Template.fromStack(stack)).toMatchSnapshot();
});

test("throws an error when feature flag is not set", () => {
  const stack = new Stack();

  const scope = new TestMonitoringScope(stack, "Scope");

  expect(() => {
    new SecretsManagerSecretMonitoring(scope, {
      secret: new Secret(stack, "Secret1"),
    });
  }).toThrow(/feature flag/);
});

test("each stack in an app gets its own publisher instance", () => {
  const app = new App();
  for (const stack of [new Stack(app, "Stack1"), new Stack(app, "Stack2")]) {
    stack.node.setContext(cx_api.SECRETS_MANAGER_PARSE_OWNED_SECRET_NAME, true);

    const scope = new TestMonitoringScope(stack, "Scope");

    new SecretsManagerSecretMonitoring(scope, {
      secret: new Secret(stack, "Secret1"),
    });

    if (stack.node.id === "Stack2") {
      new SecretsManagerSecretMonitoring(scope, {
        secret: new Secret(stack, "Secret2"),
      });
    }

    expect(Template.fromStack(stack)).toMatchSnapshot();
  }
});

beforeEach(() => {
  // reset cached publisher instances before each test
  // test stacks have duplicate uniqueIds since they don't belong to a single construct tree
  (SecretsManagerMetricsPublisher as any).instances = {};
});

afterAll = beforeEach;
