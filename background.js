chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        const authHeader = details.requestHeaders.find(
            (h) => h.name.toLowerCase() === "authorization"
        );

        if (authHeader && authHeader.value.startsWith("Bearer ")) {
            // console.log("JWT:", authHeader.value);

            chrome.storage.local.set({
                initData: {
                    jwt: authHeader.value,
                    time: new Date().toISOString(),
                },
            });
        }
    },
    {
        urls: ["https://ftugate.ftu.edu.vn/*"],
    },
    ["requestHeaders"]
);

chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
});

console.log("Ready");
