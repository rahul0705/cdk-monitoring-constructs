import { Stack } from "monocdk";
import { Template } from "monocdk/assertions";
import { TextWidget } from "monocdk/aws-cloudwatch";

import {
  DashboardRenderingPreference,
  DefaultDashboardFactory,
  SingleWidgetDashboardSegment,
} from "../../lib";

test("default dashboards created", () => {
  const stack = new Stack();

  new DefaultDashboardFactory(stack, "Dashboards", {
    dashboardNamePrefix: "DummyDashboard",
    createDashboard: true,
    createSummaryDashboard: true,
    createAlarmDashboard: true,
    renderingPreference: DashboardRenderingPreference.INTERACTIVE_ONLY,
  });

  expect(Template.fromStack(stack)).toMatchSnapshot();
});

test("no dashboards created", () => {
  const stack = new Stack();

  const dashboards = new DefaultDashboardFactory(stack, "Dashboards", {
    dashboardNamePrefix: "DummyDashboard",
    createDashboard: false,
    createSummaryDashboard: false,
    createAlarmDashboard: false,
    renderingPreference: DashboardRenderingPreference.INTERACTIVE_ONLY,
  });

  dashboards.addSegment({
    segment: new SingleWidgetDashboardSegment(
      new TextWidget({ markdown: "Hello world!" })
    ),
  });

  expect(Template.fromStack(stack)).toMatchSnapshot();
});
