(() => {
  const form = document.getElementById("riskForm");
  const submitBtn = document.getElementById("submitBtn");
  const errorNote = document.getElementById("errorNote");
  const verdict = document.getElementById("verdict");

  const incomeInput = document.getElementById("person_income");
  const amountInput = document.getElementById("loan_amnt");
  const percentInput = document.getElementById("loan_percent_income");

  const gaugeFill = document.getElementById("gaugeFill");
  const gaugeThreshold = document.getElementById("gaugeThreshold");
  const probNumber = document.getElementById("probNumber");
  const stampBadge = document.getElementById("stampBadge");
  const stampText = document.getElementById("stampText");

  const factProb = document.getElementById("factProb");
  const factThreshold = document.getElementById("factThreshold");
  const factResult = document.getElementById("factResult");

  const apiDot = document.getElementById("apiDot");
  const apiStatusText = document.getElementById("apiStatusText");

  const GAUGE_CIRCUMFERENCE = 540.35; // 2 * PI * 86, matches CSS

  const API_BASE_URL = "https://fraudshield-1wj4.onrender.com";

  // ---------- Auto-calculate loan-to-income ratio ----------
  function recalcPercent() {
    const income = parseFloat(incomeInput.value);
    const amount = parseFloat(amountInput.value);
    if (income > 0 && amount >= 0) {
      percentInput.value = (amount / income).toFixed(2);
    }
  }
  incomeInput.addEventListener("input", recalcPercent);
  amountInput.addEventListener("input", recalcPercent);
  recalcPercent();

  // ---------- Service status check ----------
  fetch(`${API_BASE_URL}/openapi.json`, { method: "GET" })
    .then((res) => {
      if (res.ok) {
        apiDot.classList.add("ok");
        apiStatusText.textContent = "service ready";
      } else {
        throw new Error("bad status");
      }
    })
    .catch(() => {
      apiDot.classList.add("down");
      apiStatusText.textContent = "service unreachable";
    });

  // ---------- Helpers ----------
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("loading", isLoading);
    submitBtn.querySelector(".btn-label").textContent = isLoading
      ? "Reviewing file…"
      : "Assess risk";
  }

  function showError(message) {
    errorNote.textContent = message;
    errorNote.hidden = false;
  }

  function clearError() {
    errorNote.hidden = true;
    errorNote.textContent = "";
  }

  function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      el.textContent = value.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to.toFixed(1);
    }
    requestAnimationFrame(tick);
  }

 
function renderVerdict(data) {
    const validRiskCategories = [
    "Very Low Risk",
    "Low Risk",
    "Medium Risk",
    "High Risk",
    "Very High Risk"
];



if (!validRiskCategories.includes(riskCategory)) {
    throw new Error("Invalid or missing risk category from API.");
}

const probability = Number(data.default_probability);
const threshold = Number(data.threshold);

if (
    !Number.isFinite(probability) ||
    !Number.isFinite(threshold) ||
    probability < 0 ||
    probability > 1 ||
    threshold < 0 ||
    threshold > 1
) {
    throw new Error("Invalid probability or threshold received.");
}

const probabilityPct = probability * 100;
const thresholdPct = threshold * 100;
const riskCategory = data.risk_category;

const riskDescriptions = {
    "Very Low Risk": "Minimal estimated probability of default.",
    "Low Risk": "Relatively low estimated default risk.",
    "Medium Risk": "Moderate estimated default probability.",
    "High Risk": "Elevated estimated default risk.",
    "Very High Risk": "Substantially elevated estimated default risk."
};

document.getElementById("riskDescription").textContent =
    riskDescriptions[riskCategory] || "Risk assessment unavailable.";

document.getElementById("activeRiskLabel").textContent =
    riskCategory || "Unknown";

document.querySelectorAll("#riskScale span").forEach(segment => {
    segment.classList.toggle(
        "active",
        segment.dataset.risk === riskCategory
    );
});


    verdict.hidden = false;
    verdict.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Risk category colors
    const riskColors = {
        "Very Low Risk": "#5f9270",
        "Low Risk": "#83a96b",
        "Medium Risk": "#d6b65e",
        "High Risk": "#d58a48",
        "Very High Risk": "#c1584d"
    };

    const riskClasses = {
        "Very Low Risk": "risk-very-low",
        "Low Risk": "risk-low",
        "Medium Risk": "risk-medium",
        "High Risk": "risk-high",
        "Very High Risk": "risk-very-high"
    };

    const riskColor = riskColors[riskCategory] || "var(--brass)";

    // Gauge fill
    const offset = GAUGE_CIRCUMFERENCE * (1 - probabilityPct / 100);

    gaugeFill.style.stroke = riskColor;

    requestAnimationFrame(() => {
        gaugeFill.style.strokeDashoffset = offset;
    });

    // Threshold tick
    gaugeThreshold.style.transform = `rotate(${thresholdPct * 3.6}deg)`;

    // Probability animation
    animateNumber(probNumber, 0, probabilityPct, 1000);

    // Risk category badge
    stampBadge.className = "stamp";

    stampBadge.classList.add(
        riskClasses[riskCategory] || "risk-low"
    );

    stampText.textContent = riskCategory
        ? riskCategory.toUpperCase()
        : "UNKNOWN RISK";

    void stampBadge.offsetWidth;

    requestAnimationFrame(() => {
        stampBadge.classList.add("stamp--in");
    });

    // Ledger facts
    factProb.textContent = `${probabilityPct.toFixed(1)}%`;
    factThreshold.textContent = `${thresholdPct.toFixed(1)}%`;
    factResult.textContent = data.Result || data.result || "—";

    // Optional risk category field
    const factRiskCategory = document.getElementById("factRiskCategory");

    if (factRiskCategory) {
        factRiskCategory.textContent = riskCategory || "—";
    }
}


  // ---------- Submit ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    const payload = {
      person_age: parseInt(document.getElementById("person_age").value, 10),
      person_income: parseFloat(incomeInput.value),
      person_home_ownership: document.getElementById("person_home_ownership").value,
      person_emp_length: parseFloat(document.getElementById("person_emp_length").value),
      loan_intent: document.getElementById("loan_intent").value,
      loan_grade: document.getElementById("loan_grade").value,
      loan_amnt: parseFloat(amountInput.value),
      loan_int_rate: parseFloat(document.getElementById("loan_int_rate").value),
      loan_percent_income: parseFloat(percentInput.value),
      cb_person_default_on_file: document.getElementById("cb_person_default_on_file").value,
      cb_person_cred_hist_length: parseInt(document.getElementById("cb_person_cred_hist_length").value, 10),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body && body.detail ? JSON.stringify(body.detail) : `HTTP ${res.status}`;
        throw new Error(detail);
      }

      const data = await res.json();
      renderVerdict(data);
    } catch (err) {
      showError(`Could not reach the ledger. ${err.message || "Check the service is running."}`);
    } finally {
      setLoading(false);
    }
  });
})();
