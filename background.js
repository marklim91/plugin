// background.js (MV3 Service Worker)

// 팝업 강제 해제 (옵션 A: 아이콘 클릭 → 새 탭)
function clearPopup() {
  try {
    chrome.action.setPopup({ popup: "" });
  } catch {}
}

chrome.runtime.onInstalled.addListener(clearPopup);
chrome.runtime.onStartup.addListener(clearPopup);

chrome.action.onClicked.addListener(() => {
  clearPopup();
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
    active: true,
  });
});

// ====== Dataverse Web API 호출 ======
async function fetchCaseByTicketNumber(token, caseNumber) {
  const base = "https://onesupport.crm.dynamics.com/api/data/v9.0/incidents";
  const select =
    "title,_msdfm_caseperfattributesid_value,_msdfm_caserestrictedattributesid_value,msdfm_customerstatement,msdfm_internaltitle,msdfm_primarycasenumber,severitycode,_msdfm_assignedto_value,statuscode,msdfm_programtype,msdfm_supportareapath";
  const safeTicket = String(caseNumber).replace(/'/g, "''");
  const query = `$filter=ticketnumber eq '${encodeURIComponent(
    safeTicket
  )}'&$top=1&$select=${encodeURIComponent(select)}`;
  const url = `${base}?${query}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      Prefer: "odata.include-annotations=*",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "SEARCH_CASE") {
    (async () => {
      try {
        const caseNumber = msg.caseNumber?.trim();
        if (!caseNumber)
          return sendResponse({ ok: false, error: "EMPTY_CASE_NUMBER" });

        const { crmAccessToken } = await chrome.storage.local.get(
          "crmAccessToken"
        );
        if (!crmAccessToken)
          return sendResponse({ ok: false, error: "NO_TOKEN" });

        const data = await fetchCaseByTicketNumber(crmAccessToken, caseNumber);
        sendResponse({ ok: true, data });
      } catch (e) {
        sendResponse({ ok: false, error: e?.message || String(e) });
      }
    })();
    return true; // 비동기 응답
  }
});
