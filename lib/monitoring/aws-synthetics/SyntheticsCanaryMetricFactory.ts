import { DimensionHash } from "monocdk/aws-cloudwatch";
import { Canary } from "monocdk/aws-synthetics";
import {
  MetricFactory,
  MetricStatistic,
  RateComputationMethod,
} from "../../common/index";

const MetricNamespace = "CloudWatchSynthetics";

export interface SyntheticsCanaryMetricFactoryProps {
  /**
   * CloudWatch Canary to monitor
   */
  readonly canary: Canary;
  /**
   * Method used to calculate relative rates
   * @default average
   */
  readonly rateComputationMethod?: RateComputationMethod;
}

export class SyntheticsCanaryMetricFactory {
  protected readonly canary: Canary;
  protected readonly metricFactory: MetricFactory;
  protected readonly rateComputationMethod: RateComputationMethod;
  protected readonly dimensions: DimensionHash;

  constructor(
    metricFactory: MetricFactory,
    props: SyntheticsCanaryMetricFactoryProps
  ) {
    this.canary = props.canary;
    this.metricFactory = metricFactory;
    this.rateComputationMethod =
      props.rateComputationMethod ?? RateComputationMethod.AVERAGE;
    this.dimensions = {
      CanaryName: props.canary.canaryName,
    };
  }

  metricLatencyAverageInMillis() {
    return this.metricFactory.adaptMetric(
      this.canary.metricDuration({
        label: "Average",
        statistic: MetricStatistic.AVERAGE,
      })
    );
  }

  metricSuccessInPercent() {
    return this.metricFactory.adaptMetric(
      this.canary.metricSuccessPercent({
        label: "Success Rate",
        statistic: MetricStatistic.AVERAGE,
      })
    );
  }

  metric4xxErrorCount() {
    return this.metricFactory.createMetric(
      "4xx",
      MetricStatistic.SUM,
      "4xx",
      this.dimensions,
      undefined,
      MetricNamespace
    );
  }

  metric4xxErrorRate() {
    const metric = this.metric4xxErrorCount();
    return this.metricFactory.toRate(
      metric,
      this.rateComputationMethod,
      false,
      "errors"
    );
  }

  metric5xxFaultCount() {
    return this.metricFactory.createMetric(
      "5xx",
      MetricStatistic.SUM,
      "5xx",
      this.dimensions,
      undefined,
      MetricNamespace
    );
  }

  metric5xxFaultRate() {
    const metric = this.metric5xxFaultCount();
    return this.metricFactory.toRate(
      metric,
      this.rateComputationMethod,
      false,
      "faults"
    );
  }
}
