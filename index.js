const pid = document.getElementById("data");
let auth;
let ctdtRows = [];

chrome.storage.local.get("initData", (res) => {
    auth = res.initData.jwt;
    get();
});

async function get() {
    try {
        const res = await fetch(
            "https://ftugate.ftu.edu.vn/cq/hanoi/api/dkmh/w-locdsnhomto",
            {
                method: "POST",
                headers: {
                    accept: "application/json, text/plain, */*",
                    "content-type": "application/json",
                    authorization: auth,
                },
                body: JSON.stringify({
                    is_CVHT: false,
                    additional: {
                        paging: { limit: 99999, page: 1 },
                        ordering: [{ name: "", order_type: "" }],
                    },
                }),
            }
        );

        if (!res.ok) throw new Error(res.status);

        const data = await res.json();

        const dsMonHoc = data?.data?.ds_mon_hoc || [];
        const monTenMap = {};

        dsMonHoc.forEach((m) => {
            // m: { ma, ten, ten_eg }
            if (m?.ma && m?.ten) {
                monTenMap[m.ma] = m.ten;
            }
        });

        ctdtRows = (data?.data?.ds_nhom_to || [])
            .filter((r) => r?.is_ctdt === true)
            .map((r) => {
                const tenVN = monTenMap[r.ma_mon];
                return {
                    ...r,
                    ten_mon: tenVN ?? r.ten_mon ?? "",
                };
            });

        console.log("CTDT (overwritten ten_mon):", ctdtRows);
        renderTable(ctdtRows);
    } catch (e) {
        console.error(e);
    }
}

function renderTable(rows) {
    pid.innerHTML = "";

    rows.forEach((r, i) => {
        const tr = document.createElement("tr");

        const dk = r.sl_dk ?? 0;
        const cp = r.sl_cp ?? 0;
        const cl = r.sl_cl ?? cp - dk;

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td class="mono">${r.ma_mon}</td>
            <td>${r.ten_mon || r.ten_mon_eg || ""}</td>
            <td>${r.so_tc ?? ""}</td>
            <td class="mono">${r.nhom_to ?? ""}</td>
            <td class="mono">${(r.ds_khoa || []).join(", ")}</td>
            <td class="mono">${dk} / ${cp} / <b>${cl}</b></td>
            <td>${(r.tkb || "").replaceAll("<hr>", "<br>")}</td>
            <td class="${r.enable ? "ok" : "no"}">
                ${r.enable}
            </td>
        `;

        pid.appendChild(tr);
    });
}

makeTableResizable();

function makeTableResizable() {
    const table = document.querySelector("table");
    if (!table) return;

    const ths = table.querySelectorAll("th");

    ths.forEach((th, colIndex) => {
        const resizer = th.querySelector(".resizer");
        if (!resizer) return;

        let startX, startWidth;

        resizer.addEventListener("mousedown", (e) => {
            startX = e.pageX;
            startWidth = th.offsetWidth;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
            e.preventDefault();
        });

        function onMouseMove(e) {
            const newWidth = startWidth + (e.pageX - startX);
            if (newWidth < 40) return;
            setColumnWidth(colIndex, newWidth);
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }
    });
}

function setColumnWidth(index, width) {
    const table = document.querySelector("table");
    if (!table) return;

    table.querySelectorAll("tr").forEach((row) => {
        const cell = row.children[index];
        if (cell) {
            cell.style.width = width + "px";
            cell.style.maxWidth = width + "px";
        }
    });
}

const btn = document.getElementById("btn-download");
if (btn) {
    btn.addEventListener("click", () => {
        if (!ctdtRows.length) {
            alert("No data!");
            return;
        }

        const jsonStr = JSON.stringify(ctdtRows, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `thunopro_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
