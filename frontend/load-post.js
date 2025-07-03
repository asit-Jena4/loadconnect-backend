document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("scheduledDate").min = today;
  document.getElementById("pickupDate").min = today;

  const fullRadio = document.getElementById("fullLoad");
  const partRadio = document.getElementById("partLoad");
  const fullFields = document.getElementById("fullLoadFields");
  const partFields = document.getElementById("partLoadFields");

  function toggleLoadType() {
    if (fullRadio.checked) {
      fullFields.style.display = "grid";
      partFields.style.display = "none";
      fullFields.querySelectorAll("input, select").forEach(el => el.required = true);
      partFields.querySelectorAll("input, select").forEach(el => el.required = false);
    } else {
      partFields.style.display = "grid";
      fullFields.style.display = "none";
      partFields.querySelectorAll("input, select").forEach(el => el.required = true);
      fullFields.querySelectorAll("input, select").forEach(el => el.required = false);
    }
  }

  fullRadio.addEventListener("change", toggleLoadType);
  partRadio.addEventListener("change", toggleLoadType);
  toggleLoadType();

  document.getElementById("loadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const raw = Object.fromEntries(formData.entries());

    let payload = {};
    if (raw.loadType === "full") {
      payload = {
        load_type: "full",
        source_city: raw.sourceCity,
        destination_city: raw.destinationCity,
        material_type: raw.material,
        weight: raw.weight,
        truck_type: raw.truckType,
        number_of_trucks: raw.numTrucks,
        scheduled_date: raw.scheduledDate
      };
    } else {
      payload = {
        load_type: "part",
        source_city: raw.sourceCity2,
        destination_city: raw.destinationCity2,
        source_pin_code: raw.sourcePinCode || null,
        destination_pin_code: raw.destinationPinCode || null,
        pickup_type: raw.pickupType,
        material_type: raw.material2,
        weight: raw.weight2,
        pickup_date: raw.pickupDate
      };
    }

    try {
      const res = await fetch("https://loadconnect-backend-1.onrender.com/api/load/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        alert("✅ Load posted successfully!");
        e.target.reset();
        document.getElementById("fullLoad").checked = true;
        toggleLoadType();
        fetchRecentLoads(); // Refresh recent loads
      } else {
        alert("❌ Failed: " + result.error);
      }
    } catch (err) {
      console.error("🚫 Error:", err);
      alert("🚫 Server error. Try again later.");
    }
  });

  // Auto-formatting, pin validation, etc.
  document.querySelectorAll('#sourceCity, #destinationCity, #sourceCity2, #destinationCity2').forEach(input => {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/\b\w/g, l => l.toUpperCase());
    });
  });

  document.querySelectorAll('#sourcePinCode, #destinationPinCode').forEach(input => {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 6);
    });
  });

  document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('blur', function () {
      this.style.borderColor = this.required && !this.value.trim() ? '#ff4444' : '';
    });
  });

  // 🆕 Fetch recent loads
  function fetchRecentLoads() {
    fetch("https://loadconnect-backend-1.onrender.com/api/loads")
      .then(res => res.json())
      .then(data => {
        const tbody = document.getElementById("recent-loads-body");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (data.success && data.data.length > 0) {
          data.data.forEach(load => {
            const tr = document.createElement("tr");
            tr.dataset.loadid = load.id;  // Important for quote button
            tr.innerHTML = `
              <td>${load.source_city || "-"}</td>
              <td>${load.destination_city || "-"}</td>
              <td>${load.distance || "N/A"}</td>
              <td>${load.weight || "N/A"} MT</td>
              <td>${load.scheduled_date || load.pickup_date || "N/A"}</td>
              <td>${load.material_type || "N/A"}</td>
              <td>${load.truck_type || "N/A"}</td>
              <td>${load.posted_by || "Customer"}</td>
              <td class="actions-cell"><a href="#" class="contact-btn">View Contact</a></td>
              <td class="actions-cell"><a href="#" class="quote-btn">Quote Now</a></td>
            `;
            tbody.appendChild(tr);
          });
        } else {
          tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">No recent loads found.</td></tr>`;
        }
      })
      .catch(err => {
        console.error("❌ Failed to load recent loads:", err);
        const tbody = document.getElementById("recent-loads-body");
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">Server error</td></tr>`;
        }
      });
  }

  fetchRecentLoads();

  // 🧾 Handle quotation submission
  document.getElementById("recent-loads-body").addEventListener("click", async function (e) {
    if (e.target.classList.contains("quote-btn")) {
      e.preventDefault();
      const row = e.target.closest("tr");
      const loadId = row.dataset.loadid;
      const user = JSON.parse(localStorage.getItem("loadconnectUser"));

      if (!user || user.role !== "customer") {
        return alert("🚫 Please login as a customer to quote.");
      }

      const price = prompt("Enter your quotation price:");
      if (!price || isNaN(price)) {
        return alert("❌ Invalid price input.");
      }

      const message = prompt("Optional message for operator:");

      try {
        const res = await fetch("https://loadconnect-backend-1.onrender.com/api/quotation/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            load_id: loadId,
            customer_id: user.id,
            price,
            message
          })
        });

        const result = await res.json();
        if (result.success) {
          alert("✅ Quote submitted successfully!");
        } else {
          alert("❌ Failed to submit quote: " + (result.error || "Unknown error."));
        }
      } catch (err) {
        console.error("🚫 Error submitting quote:", err);
        alert("🚫 Server error while submitting quote.");
      }
    }
  });
});
