// plugin-dashboard.js
"use strict";

// Service Worker 컨텍스트 보호: DOM이 없으면 조용히 종료
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("caseSearchForm");
    const caseInput = document.getElementById("caseNumber");
    let summaryBlock = document.getElementById("summaryBlock");
    // Elements for controlled reveal
    const caseSummaryEl = document.getElementById("caseSummary");
    const zebraEl = document.getElementById("zebraInsight");
    const caseTemplate = document.getElementById("caseSummaryTemplate");
    const zebraTemplate = document.getElementById("zebraTemplate");
    // create a summary block if not present
    if (!summaryBlock && form) {
      summaryBlock = document.createElement("div");
      summaryBlock.id = "summaryBlock";
      summaryBlock.className = "card__section kv mono";
      form.insertAdjacentElement("afterend", summaryBlock);
    }
    const btnKusto = document.getElementById("btnKusto");

    // Kusto 버튼 (원하시는 실제 URL로 교체)
    if (btnKusto) {
      btnKusto.addEventListener("click", (e) => {
        e.preventDefault();
        alert("Navigate to Kusto Explorer (TODO: replace with real URL).");
      });
    }

    // Kusto Explorer 기능
    const serviceButtons = document.querySelectorAll(".service-btn");
    const paramGroups = document.querySelectorAll(".param-group");
    const openDashboardBtn = document.getElementById("openDashboard");

    // 대시보드 URL 매핑
    const dashboardUrls = {
      postgresql:
        "https://dataexplorer.azure.com/dashboards/91b15240-f63e-43d3-af40-90b140f1ed5e",
      mysql:
        "https://dataexplorer.azure.com/dashboards/8113e75e-c293-4e51-a482-e446b3d7a8ba",
      pbiadf:
        "https://dataexplorer.azure.com/dashboards/06dacbae-af0f-47e8-8d05-dae2816ec947",
    };

    // 서비스 버튼 클릭 이벤트
    serviceButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const service = e.target.dataset.service;

        // 모든 버튼에서 active 클래스 제거
        serviceButtons.forEach((btn) => btn.classList.remove("active"));
        // 클릭된 버튼에 active 클래스 추가
        e.target.classList.add("active");

        // 모든 파라미터 그룹 숨기기
        paramGroups.forEach((group) => group.classList.remove("active"));
        // 선택된 서비스의 파라미터 그룹 표시
        document.getElementById(`${service}-params`).classList.add("active");
      });
    });

    // 대시보드 열기 버튼 클릭 이벤트
    if (openDashboardBtn) {
      openDashboardBtn.addEventListener("click", (e) => {
        e.preventDefault();

        // 현재 선택된 서비스 찾기
        const activeBtn = document.querySelector(".service-btn.active");
        if (!activeBtn) return;

        const service = activeBtn.dataset.service;
        const baseUrl = dashboardUrls[service];

        // 파라미터 수집
        const params = new URLSearchParams();

        if (service === "postgresql") {
          const timeRange = document.getElementById("timeRange").value;
          const region = document.getElementById("region").value;
          const serverName = document.getElementById("serverName").value;
          const vmName = document.getElementById("vmName").value;

          // 시간 범위를 startTime 형식으로 변환
          const timeMapping = {
            PT1H: "1hours",
            PT3H: "3hours",
            PT24H: "24hours",
            P7D: "7days",
          };

          if (timeRange) {
            params.append("p-_startTime", timeMapping[timeRange] || timeRange);
            params.append("p-_endTime", "now");
          }
          if (region) params.append("p-Region", region);
          if (serverName)
            params.append("p-_ServerName", serverName || "no-selection");
          if (vmName)
            params.append("p-_VirtualMachinName", vmName || "query-result");
        } else if (service === "mysql") {
          const timeRange = document.getElementById("mysqlTimeRange").value;
          const region = document.getElementById("mysqlRegion").value;
          const serverName = document.getElementById("mysqlServerName").value;
          // const vmName = document.getElementById("mysqlVmName").value;

          // MySQL도 동일한 시간 매핑 사용
          const timeMapping = {
            PT1H: "1hours",
            PT3H: "3hours",
            PT24H: "24hours",
            P7D: "7days",
          };

          if (timeRange) {
            params.append("p-_startTime", timeMapping[timeRange] || timeRange);
            params.append("p-_endTime", "now");
          }
          if (region) params.append("p-Region", region);
          if (serverName)
            params.append("p-_ServerName", serverName || "no-selection");
          // if (vmName)
          //   params.append("p-_VirtualMachinName", vmName || "query-result");
        } else if (service === "pbiadf") {
          const timeRange = document.getElementById("pbiadfTimeRange").value;
          const region = document.getElementById("pbiadfRegion").value;

          // PBI/ADF도 동일한 시간 매핑 사용
          const timeMapping = {
            PT1H: "1hours",
            PT3H: "3hours",
            PT24H: "24hours",
            P7D: "7days",
          };

          if (timeRange) {
            params.append("p-_startTime", timeMapping[timeRange] || timeRange);
            params.append("p-_endTime", "now");
          }
          if (region) params.append("p-Region", region);
        }

        // 최종 URL 생성
        const finalUrl = params.toString()
          ? `${baseUrl}?${params.toString()}`
          : baseUrl;

        // 새 탭에서 열기
        window.open(finalUrl, "_blank");
      });
    }

    // Search 처리: on initial load keep summary/insight empty; populate on submit
    if (form) {
      // ensure initial empty state
      try {
        if (caseSummaryEl) caseSummaryEl.innerHTML = "";
        if (zebraEl) zebraEl.innerHTML = "";
      } catch (err) {
        /* ignore */
      }

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // const caseNumber = (caseInput?.value || "").trim();
        // if (!caseNumber) {
        //   alert("Case Number를 입력하세요.");
        //   return;
        // }

        //if (summaryBlock) summaryBlock.textContent = "Loading...";

        // Short-circuit: API call logic is intentionally disabled for demo/testing.
        // Show Loading.. in both areas for 1 second, then populate templates.
        try {
          if (caseSummaryEl) caseSummaryEl.textContent = "Loading..";
          if (zebraEl) zebraEl.textContent = "Loading..";
          //if (summaryBlock) summaryBlock.textContent = "Loading...";

          // wait 1 second then inject templates
          await new Promise((res) => setTimeout(res, 1000));

          if (caseSummaryEl)
            caseSummaryEl.innerHTML = caseTemplate?.innerHTML || "";
          if (zebraEl) zebraEl.innerHTML = zebraTemplate?.innerHTML || "";
          if (summaryBlock) summaryBlock.textContent = "";
        } catch (err) {
          // ignore template injection errors
        }
        return; // skip the original API fetch & processing

        /*
        Note: original API call / fetch logic remains below for reference but is
        intentionally commented out while demos/tests run without network calls.

        try {
          // Build Dynamics API URL with the input ticket number
          let res;
          const base =
            "https://onesupport.crm.dynamics.com/api/data/v9.0/incidents";
          const select =
            "title,_msdfm_caseperfattributesid_value,_msdfm_caserestrictedattributesid_value,msdfm_customerstatement,msdfm_internaltitle,msdfm_primarycasenumber,severitycode,_msdfm_assignedto_value,statuscode,msdfm_programtype,msdfm_supportareapath";
          const filter = encodeURIComponent(`ticketnumber eq '${caseNumber}'`);
          const url = `${base}?$filter=${filter}&$top=1&$select=${encodeURIComponent(
            select
          )}`;

          // Send fetch WITHOUT Authorization header (unauthenticated request)
          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
            },
            // credentials: 'include' // enable if cookies are required by the API
          });

          if (!response.ok) {
            const status = response.status;
            const text = await response.text().catch(() => "");
            // If client-side 4xx error, likely auth/VPN/network—advise user to connect VPN
            if (status >= 400 && status < 500) {
              if (summaryBlock) {
                summaryBlock.innerHTML = `
                  <div role="status" aria-live="polite" style="padding:12px;border-left:4px solid #f59e0b;background:#fff7ed;color:#92400e;border-radius:6px;">
                    <strong>네트워크 오류:</strong> 서버에서 요청을 거부했습니다 (HTTP ${status}).<br/>
                    회사 네트워크 또는 VPN에 연결되어 있는지 확인한 뒤 재시도해 주세요.
                    <div style="margin-top:8px">
                      <button id="vpnRetryBtn" class="btn">다시 시도</button>
                    </div>
                  </div>`;

                // Attach retry handler
                setTimeout(() => {
                  const retryBtn = document.getElementById("vpnRetryBtn");
                  if (retryBtn) {
                    retryBtn.addEventListener("click", () => {
                      try {
                        if (typeof form.requestSubmit === "function")
                          form.requestSubmit();
                        else
                          form.dispatchEvent(
                            new Event("submit", { cancelable: true })
                          );
                      } catch (err) {
                        // fallback: click the search button
                        const searchBtn = form.querySelector(
                          'button[type="submit"]'
                        );
                        if (searchBtn) searchBtn.click();
                      }
                    });
                  }
                }, 0);
              }
              // stop further processing for 4xx
              return;
            }
            res = { ok: false, error: `HTTP ${status}: ${text}` };
          } else {
            const data = await response.json();
            res = { ok: true, data };
          }

          if (!res || !res.ok) {
            if (res?.error === "NO_TOKEN") {
              if (summaryBlock)
                summaryBlock.textContent =
                  "인증 토큰이 없습니다. 먼저 토큰을 저장하세요.";
              alert(
                '인증 토큰이 없습니다.\n콘솔에서 아래 명령으로 임시 저장 가능:\n\nawait chrome.storage.local.set({ crmAccessToken: "YOUR_ACCESS_TOKEN" })'
              );
            } else if (res?.error === "EMPTY_CASE_NUMBER") {
              if (summaryBlock)
                summaryBlock.textContent = "Case Number를 입력하세요.";
            } else {
              if (summaryBlock)
                summaryBlock.textContent =
                  "오류 발생: " + (res?.error || "Unknown error");
            }
            return;
          }

          const value = res.data?.value;
          if (!Array.isArray(value) || value.length === 0) {
            if (summaryBlock)
              summaryBlock.textContent = "검색 결과가 없습니다.";
            return;
          }

          const rec = value[0];
          const title = rec.title || "";
          const internalTitle = rec.msdfm_internaltitle || "";
          const customerStatement = rec.msdfm_customerstatement || "";
          const primaryCase = rec.msdfm_primarycasenumber || "";
          const severity = rec.severitycode;
          const status = rec.statuscode;
          const supportArea = rec.msdfm_supportareapath || "";
          const assignedTo = rec["_msdfm_assignedto_value"] || "";

          // Show successful case summary in the Case Summary card
          const caseSummaryEl = document.getElementById("caseSummary");
          const formatted = [
            `Title: ${title}`,
            `Internal Title: ${internalTitle}`,
            `Primary Case: ${primaryCase}`,
            `Severity: ${severity}`,
            `Status: ${status}`,
            `Assigned To: ${assignedTo}`,
            `Support Area: ${supportArea}`,
            `Customer Statement: ${customerStatement}`,
          ].join("<br/>");

          if (caseSummaryEl) {
            // insert server-returned formatted data, otherwise use template
            caseSummaryEl.innerHTML =
              formatted || caseTemplate?.innerHTML || "";
            // populate zebra insight from template
            if (zebraEl) zebraEl.innerHTML = zebraTemplate?.innerHTML || "";
            // clear any previous messages in the search area
            if (summaryBlock) summaryBlock.textContent = "";
          } else if (summaryBlock) {
            // fallback: if Case Summary area not present, show in search area
            summaryBlock.innerHTML = formatted || caseTemplate?.innerHTML || "";
            if (zebraEl) zebraEl.innerHTML = zebraTemplate?.innerHTML || "";
          }
          // Map supportArea -> SAP input value
          try {
            const sapInput = document.getElementById("sap");
            if (sapInput) {
              // small mapping table
              const mapping = {
                "Azure/Databricks/Cluster/Cluster launch or creation failure due to other errors":
                  "Azure/Databricks/Cluster/Cluster launch or creation failure",
                // add more explicit mappings here as needed
              };

              const mapped = mapping[supportArea];
              if (mapped) sapInput.value = mapped;
              else {
                // fallback: use first three path segments if available
                const parts = supportArea
                  .split("/")
                  .map((s) => s.trim())
                  .filter(Boolean);
                sapInput.value = parts.slice(0, 3).join("/") || supportArea;
              }
            }
          } catch (e) {
            // ignore mapping errors
            console.warn("SAP mapping failed", e);
          }
        } catch (err) {
          console.error(err);
          if (summaryBlock)
            summaryBlock.textContent =
              "오류 발생: " + (err?.message || String(err));
        }
        */
      });

      // Clear content on reset so the dashboard returns to initial empty state
      form.addEventListener("reset", (e) => {
        try {
          if (caseSummaryEl) caseSummaryEl.innerHTML = "";
          if (zebraEl) zebraEl.innerHTML = "";
          if (summaryBlock) summaryBlock.textContent = "";
        } catch (err) {
          // ignore
        }
      });
    }
  });
}
