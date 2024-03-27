

chrome.tabs.query({active:true ,currentWindow: true }).then(getSelectedTab);


function getSelectedTab(tabs) {
    var sendMessage = (messageObj) => {chrome.tabs.sendMessage(tabs[0].id,messageObj)};

    document.querySelector("#run").addEventListener("click",(e)=>{
        sendMessage({ action: 'run' });
    })
    document.querySelector("#stop").addEventListener("click",(e)=>{
        sendMessage({ action: 'stop' });
    })
}