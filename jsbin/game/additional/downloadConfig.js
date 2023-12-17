const get_product_url =
  "https://x8ki-letl-twmt.n7.xano.io/api:iwAsZq4E/products/"; // + price id

const urlParams = new URLSearchParams(window.location.search);
const gameIdParam = urlParams.get("g");
const priceIdParam = urlParams.get("p");

async function setGameData(gameId) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const options = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  async function getGameData() {
    try {
      const response = await fetch(get_product_url + gameId, options);
      const result = await response.text();
      const result_parse = JSON.parse(result);

      return result_parse;
    } catch (error) {
      window.location.assign("404");
    }
  }

  const gameData = await getGameData();

  const title = document.getElementById("title");
  const devname = document.getElementById("dev-name");
  const return_button = document.getElementById("game-page");
  const file_name = document.getElementById("file-name");
  const nav_title = document.getElementById("navigation-title");

  title.textContent = `Download: "${gameData.name}"`;
  nav_title.textContent = `Download ${gameData.name}`;
  devname.textContent = `By: ${gameData.metadata.developer_name}`;
  file_name.textContent = `${gameData.metadata.file_name} (${gameData.metadata.size} MB)`;
  return_button.setAttribute("href", `game?g=${priceIdParam}`);
}

if (gameIdParam && priceIdParam) {
  setGameData(`prod_${gameIdParam}`);
} else {
  console.warn("There are no params.");
  window.location.assign("404");
}