const pid = document.getElementById("data");
let auth;

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
        renderTable(data.data.ds_nhom_to);
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
            <td>${r.ten_mon_eg || ""}</td>
            <td>${r.so_tc}</td>
            <td class="mono">${r.nhom_to}</td>
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
            if (newWidth < 40) return; // min width
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
    table.querySelectorAll("tr").forEach((row) => {
        const cell = row.children[index];
        if (cell) {
            cell.style.width = width + "px";
            cell.style.maxWidth = width + "px";
        }
    });
}
