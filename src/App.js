import React, { useState } from "react";
import { gamma } from "jstat";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Parameters for logistic and gamma models
const params = {
  logit_model: {
    Intercept: -4.259485,
    v919: 0.33518,
    gender: 0.331033,
    first_threshold: 0.024602,
  },
  gamma_model: {
    Intercept: 3.219828,
    v7232: -1.14074,
    v919: -0.850773,
    first_age: -0.038724,
    shape: 1.2490949,
    loc: 0.247527525556966,
  },
};

// Function to simulate individual-level percentiles
const simulatePercentiles = (bph, age, genotype, gender) => {
  let v7232, v919;
  switch (genotype) {
    case "G20":
      v7232 = 2;
      v919 = 0;
      break;
    case "G11":
      v7232 = 1;
      v919 = 1;
      break;
    case "G10":
      v7232 = 1;
      v919 = 0;
      break;
    case "G01":
      v7232 = 0;
      v919 = 1;
      break;
    case "G00":
      v7232 = 0;
      v919 = 0;
      break;
    default:
      throw new Error(`Unknown genotype: ${genotype}`);
  }
  const first_threshold = bph;

  // Logistic Model for zero-progression probability
  const logit_0 =
    params.logit_model.Intercept +
    params.logit_model.v919 * v919 +
    params.logit_model.gender * (gender === "Male" ? 1 : 0) +
    params.logit_model.first_threshold * first_threshold;

  const prob_0 = Math.exp(logit_0) / (1 + Math.exp(logit_0));

  // Gamma Model for non-zero progression
  const lambda_0 = Math.exp(
    params.gamma_model.Intercept +
      params.gamma_model.v7232 * v7232 +
      params.gamma_model.v919 * v919
  );
  const shape = params.gamma_model.shape;
  const loc = params.gamma_model.loc;
  const scale = lambda_0 / shape;

  // Simulate trajectories
  const numSimulations = 1000;
  const simulatedThresholds = [];
  for (let i = 0; i < numSimulations; i++) {
    // Determine zero or non-zero progression
    const isZeroProgression = Math.random() < prob_0;
    let lambdaValue = 0;
    if (!isZeroProgression) {
      // lambdaValue = loc + scale * Math.random() * shape;
      lambdaValue = loc + gamma.sample(shape, scale);
    }

    // Generate hearing trajectories
    const trajectory = [];
    for (let simAge = 0; simAge <= 40; simAge++) {
      const threshold = Math.max(0, Math.min(120, first_threshold + lambdaValue * (simAge - age)));
      trajectory.push({ age: simAge, threshold });
    }
    simulatedThresholds.push(trajectory);
  }

  // Calculate percentiles for each age
  const percentiles = [];
  for (let simAge = 0; simAge <= 40; simAge++) {
    const thresholdsAtAge = simulatedThresholds.map((t) => t[simAge].threshold);
    thresholdsAtAge.sort((a, b) => a - b);
    const p10 = thresholdsAtAge[Math.floor(numSimulations * 0.1)];
    const p20 = thresholdsAtAge[Math.floor(numSimulations * 0.2)];
    const p30 = thresholdsAtAge[Math.floor(numSimulations * 0.3)];
    const p40 = thresholdsAtAge[Math.floor(numSimulations * 0.4)];
    const p50 = thresholdsAtAge[Math.floor(numSimulations * 0.5)];
    const p60 = thresholdsAtAge[Math.floor(numSimulations * 0.6)];
    const p70 = thresholdsAtAge[Math.floor(numSimulations * 0.7)];
    const p80 = thresholdsAtAge[Math.floor(numSimulations * 0.8)];
    const p90 = thresholdsAtAge[Math.floor(numSimulations * 0.9)];
    percentiles.push({ age: simAge, P10: p10, P20: p20, P30: p30, P40: p40, P50: p50, P60: p60, P70: p70, P80: p80, P90: p90 });
  }

  return percentiles;
};

const App = () => {
  const [bph, setBph] = useState("");
  const [age, setAge] = useState("");
  const [genotype, setGenotype] = useState("");
  const [gender, setGender] = useState("");
  const [results, setResults] = useState([]);
  const [chartData, setChartData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bph || !age || !genotype || !gender) {
      alert("All fields are required!");
      return;
    }

    // Run the simulation and calculate percentiles
    const percentiles = simulatePercentiles(
      parseFloat(bph),
      parseInt(age, 10),
      genotype,
      gender
    );
    setResults(percentiles);

    // Prepare data for the chart
    const ages = percentiles.map((d) => d.age);
    const P10 = percentiles.map((d) => d.P10);
    const P20 = percentiles.map((d) => d.P20);
    const P30 = percentiles.map((d) => d.P30);
    const P40 = percentiles.map((d) => d.P40);
    const P50 = percentiles.map((d) => d.P50);
    const P60 = percentiles.map((d) => d.P60);
    const P70 = percentiles.map((d) => d.P70);
    const P80 = percentiles.map((d) => d.P80);
    const P90 = percentiles.map((d) => d.P90);

    setChartData({
      labels: ages,
      datasets: [
        {
          label: "P10",
          data: P10,
          borderColor: "rgba(135, 206, 250, 0.3)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "P20",
          data: P20,
          borderColor: "rgba(135, 206, 250, 0.5)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "P30",
          data: P30,
          borderColor: "rgba(135, 206, 250, 0.7)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "P40",
          data: P40,
          borderColor: "rgba(135, 206, 250, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "P50 (Median)",
          data: P50,
          borderColor: "rgba(0, 123, 255, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "P60",
          data: P60,
          borderColor: "rgba(135, 206, 250, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "P70",
          data: P70,
          borderColor: "rgba(135, 206, 250, 0.7)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "P80",
          data: P80,
          borderColor: "rgba(135, 206, 250, 0.5)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "P90",
          data: P90,
          borderColor: "rgba(135, 206, 250, 0.3)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
      ],
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Hearing Percentile Simulation</h2>
      <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-light mb-4">
        <div className="row g-3">
          <div className="col-md-2">
          {/* <label htmlFor="bph" className="form-label fw-bold">Initial BPH (dB):</label> */}
          <input
            type="number"
            step="0.1"
            id="bph"
            value={bph}
            onChange={(e) => setBph(e.target.value)}
            required
            className="form-control"
            placeholder="Enter Initial BPH"
            />
          </div>
          <div className="col-md-2">
          {/* <label htmlFor="age" className="form-label fw-bold">Initial Test Age (Years):</label> */}
          <input
            type="number"
            step="1"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            className="form-control"
            placeholder="Enter Test Age"
          />
          </div>
          <div className="col-md-3">
          {/* <label htmlFor="genotype" className="form-label fw-bold">Genotype:</label> */}
          <select
            id="genotype"
            value={genotype}
            onChange={(e) => setGenotype(e.target.value)}
            required
            className="form-select"
          >
            <option value="">Select Genotype</option>
            <option value="G20">H723R/H723R</option>
            <option value="G11">H723R/IVS7-2A&gt;G</option>
            <option value="G10">H723R/other</option>
            <option value="G01">IVS7-2A&gt;G/other</option>
            <option value="G00">Other/other</option>
          </select>
          </div>
          <div className="col-md-3">
          {/* <label htmlFor="gender" className="form-label fw-bold">Gender:</label> */}
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            className="form-select"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">
              Simulate
            </button>
          </div>
        </div>
      </form>

      {chartData && (
        <div>
          <h2>Simulated Percentile Curves</h2>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: false,
                  text: "Hearing Trajectories by Percentile",
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: "Age (Years)",
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: "Threshold (dB)",
                  },
                  reverse: true, // Flip the y-axis
                  min: 0,        // Set the minimum value of the y-axis
                  max: 120,      // Set the maximum value of the y-axis
                },
              },
            }}
          />
        </div>
      )}      

      {results.length > 0 && (
        <div>
          <h2>Simulated Percentiles</h2>
          <table className="table table-striped table-bordered table-hover">
          <thead className="table-primary">
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Age</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>P10</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>P50</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>P90</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.age}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.P10.toFixed(1)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.P50.toFixed(1)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.P90.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;
