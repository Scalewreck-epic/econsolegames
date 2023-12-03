const games_list_api = "https://x8ki-letl-twmt.n7.xano.io/api:V36A7Ayv/games";
const games_prices_url =
  "https://x8ki-letl-twmt.n7.xano.io/api:tFdG2Vz-/prices";

import { getUser } from "./exportuser.js";

const urlParams = new URLSearchParams(window.location.search);
const search_query = encodeURIComponent(urlParams.get("q") || "");
const category_name = encodeURIComponent(urlParams.get("n") || "");

let prices = [];
let games = [];
let genres = [];

function getGamePrice(game_id) {
  const result = prices.find((item) => item.product === game_id);
  if (result) {
    return {
      price: result.unit_amount,
      currency: result.currency,
    };
  }

  return {
    price: 0,
    currency: "USD",
  };
}

function calculateDiffDays(timestamp) {
  const createdTimestamp = new Date(timestamp);
  const currentDate = new Date();

  const createdTimeDiff = Math.abs(
    currentDate.getTime() - createdTimestamp.getTime()
  );
  const createdDiffDays = Math.ceil(createdTimeDiff / (1000 * 3600 * 24));

  return createdDiffDays;
}

function createGenrePage(name, amount) {
  const genre_button = document.createElement("a");
  genre_button.className = "genre-button";

  const genre_name = document.createElement("div");
  const genre_games_amount = document.createElement("h4");

  genre_name.textContent = name;
  genre_name.className = "genre-name";
  genre_button.setAttribute("href", `category?n=${name}`);

  genre_games_amount.textContent =
    amount > 1 ? `${amount} games` : `${amount} game`;

  genre_button.appendChild(genre_name);
  genre_button.appendChild(genre_games_amount);

  document.getElementById("genres-list").appendChild(genre_button);
}

function createGamePage(game, game_price, market) {
  const price = game_price.price / 100;
  const currency = game_price.currency;

  const gamesDiv = document.createElement("div");
  gamesDiv.className = "game";

  const gameImage = document.createElement("img");
  gameImage.className = "product-image";
  gameImage.setAttribute("src", game.icon.url);

  const gameImageContainer = document.createElement("a");
  gameImageContainer.className = "product-image-container";

  const gameTitle = document.createElement("a");
  gameTitle.className = "product-title";
  gameTitle.textContent = game.name;

  gameImageContainer.setAttribute("href", `game?g=${game.id}`);
  gameTitle.setAttribute("href", `game?g=${game.id}`);

  const gameSummary = document.createElement("div");
  gameSummary.className = "product-summary";
  gameSummary.textContent = game.summary;

  const gamePrice = document.createElement("div");
  gamePrice.className = "product-price";

  const gamePriceText = document.createElement("span");
  gamePriceText.innerHTML = `${price} ${currency.toUpperCase()}`;

  const diffDaysCreated = calculateDiffDays(game.created_at);
  const diffDaysUpdated = calculateDiffDays(game.updated_at);

  gamePrice.appendChild(gamePriceText);

  gameImageContainer.appendChild(gameImage);
  gameImageContainer.appendChild(gamePrice);

  if (diffDaysCreated <= 7) {
    const createdLabel = document.createElement("div");
    createdLabel.className = "new-label";

    const createdText = document.createElement("span");
    createdText.innerHTML = "NEW";

    createdLabel.appendChild(createdText);
    gameImageContainer.appendChild(createdLabel);

    createdLabel.addEventListener("mouseenter", function () {
      if (diffDaysCreated != 1) {
        createdText.innerHTML = `${diffDaysCreated} DAYS AGO`;
      } else {
        createdText.innerHTML = `TODAY`;
      }
    });

    createdLabel.addEventListener("mouseleave", function () {
      createdText.innerHTML = "NEW";
    });
  } else if (diffDaysUpdated <= 7) {
    const updatedLabel = document.createElement("div");
    updatedLabel.className = "updated-label";

    const updatedText = document.createElement("span");
    updatedText.innerHTML = "UPDATED";

    updatedLabel.appendChild(updatedText);
    gameImageContainer.appendChild(updatedLabel);

    updatedLabel.addEventListener("mouseenter", function () {
      if (diffDaysCreated != 1) {
        updatedText.innerHTML = `${diffDaysUpdated} DAYS AGO`;
      } else {
        updatedText.innerHTML = `TODAY`;
      }
    });

    updatedLabel.addEventListener("mouseleave", function () {
      updatedText.innerHTML = "UPDATED";
    });
  }
  gamesDiv.appendChild(gameImageContainer);
  gamesDiv.appendChild(gameTitle);
  gamesDiv.appendChild(gameSummary);

  market.appendChild(gamesDiv);
}

function levenshteinDistance(a, b) {
  const dp = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const indicator = a[i - 1] == b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + indicator
      );
    }
  }

  return dp[a.length][b.length];
}

function calculateSimilarity(a, b) {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

function removePrivateGames() {
  const newGames = games.filter((game) => game.active == true);
  games = newGames;
}

function removeIrrelevantGenres() {
  const similarityThreshold = 0.15;

  if (search_query != "") {
    const relevantGenres = genres.map((genre) => {
      const similarity = calculateSimilarity(search_query, genre.name);

      if (similarity > similarityThreshold) {
        return {
          ...genre,
          relevance: similarity,
        };
      } else {
        return null;
      }
    });

    genres = relevantGenres.filter((genre) => genre !== null);
  }
}

function removeIrrelevantGames() {
  const similarityThreshold = 0.15;

  if (category_name != "") {
    const genreGames = games.filter((game) => game.genre == category_name);
    games = genreGames;
  }

  if (search_query != "") {
    const relevantGames = games.map((game) => {
      const nameSimilarity = calculateSimilarity(search_query, game.name);
      const summarySimilarity = calculateSimilarity(search_query, game.summary);

      const similarity = nameSimilarity * 0.7 + summarySimilarity * 0.3;

      if (similarity > similarityThreshold) {
        return {
          ...game,
          relevance: similarity,
        };
      } else {
        return null;
      }
    });

    games = relevantGames.filter((game) => game !== null);
  }
}

function loadGamesWithList(list, category, gameslist) {
  const filteredGames = gameslist.filter((game) => game && game.active);

  filteredGames.forEach((game) => {
    const game_price = getGamePrice(game.id.toString());
    createGamePage(game, game_price, list);
  });

  if (filteredGames.length > 0) {
    const categoryNoneElement = category.querySelector(".category-none");

    if (categoryNoneElement) {
      categoryNoneElement.remove();
    }
  }
}

function loadGenres() {
  if (window.location.pathname.includes("/search")) {
    genres.sort((a, b) => b.relevance - a.relevance);
  } else {
    genres.sort((a, b) => b.count - a.count);
  }

  genres.forEach((genre) => {
    createGenrePage(genre.name, genre.count);
  });

  if (genres.length > 0) {
    const categoryNoneElement = document
      .getElementById("genres")
      .querySelector(".category-none");

    if (categoryNoneElement) {
      categoryNoneElement.remove();
    }
  }
}

function sortGames(listId, gamesList, sortingFunction) {
  gamesList.sort(sortingFunction);

  const listElement = document.getElementById(listId);
  const gamesElement = document.getElementById(listId.replace("-list", ""));

  loadGamesWithList(listElement, gamesElement, gamesList);
}

function loadGames() {
  if (
    window.location.pathname.includes("/search") ||
    window.location.pathname.includes("/category")
  ) {
    const results_label = document.getElementById("results-label");
    if (games.length == 1) {
      results_label.textContent = "(" + games.length + " result)"
    } else {
      results_label.textContent = "(" + games.length + " results)"
    }

    sortGames("relevant-games-list", games, (a, b) => {
      b.relevance - a.relevance;
    });
  } else {
    // Fresh Games
    sortGames("fresh-games-list", games, (a, b) => {
      const scoreA = a.created * 0.8 + a.downloads * 0.2;
      const scoreB = b.created * 0.8 + b.downloads * 0.2;

      return scoreB - scoreA;
    });

    // Hot Games
    sortGames("hot-games-list", games, (a, b) => {
      const scoreA = a.downloads * 0.6 + a.updated * 0.4;
      const scoreB = b.downloads * 0.6 + b.updated * 0.4;

      return scoreB - scoreA;
    });

    // Sponsored Games
    const sponsoredGames = games.filter((game) => game.sponsor_money > 0);
    sortGames("sponsored-games-list", sponsoredGames, (a, b) => {
      const scoreA = a.sponsor_money * 0.6 + a.downloads * 0.4;
      const scoreB = b.sponsor_money * 0.6 + b.downloads * 0.4;

      return scoreB - scoreA;
    });

    // Bestsellers
    sortGames("bestseller-games-list", games, (a, b) => {
      const scoreA = a.downloads * 0.8 + a.updated * 0.2;
      const scoreB = b.downloads * 0.8 + b.updated * 0.2;

      return scoreB - scoreA;
    });

    // Free Games
    const freegames = games.filter((game) => game.free == true);
    sortGames("free-games-list", freegames, (a, b) => {
      const scoreA = a.downloads * 0.7 + a.updated * 0.3;
      const scoreB = b.downloads * 0.7 + b.updated * 0.3;

      return scoreB - scoreA;
    });
  }
}

async function loadDashboard() {
  const category = document.getElementById("dashboard-market");
  const user = await getUser();

  if (user != undefined) {
    const usersGames = games.filter((game) => game.developer_name == user.name);
    usersGames.sort((a, b) => b.created - a.created);

    usersGames.forEach((game) => {
      const game_price = getGamePrice(game.id.toString());
      createGamePage(game, game_price, category);
    });

    if (usersGames.length > 0) {
      const categoryNoneElement = category.querySelector(".category-none");

      if (categoryNoneElement) {
        categoryNoneElement.remove();
      }
    } else {
      console.info("User has no available games remaining.");
    }
  }
}

async function fetchGamesRequest() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  async function setPrices() {
    try {
      const response = await fetch(games_prices_url, requestOptions);
      const result = await response.text();
      const result_parse = JSON.parse(result);

      prices = result_parse.data;

      if (prices.length > 0) {
        prices.sort((a, b) => b.unit_amount - a.unit_amount);
      }
    } catch (error) {
      console.error(`There was an error trying to set prices: ${error}`);
    };
  };

  function setGenres() {
    for (const game of games) {
      let found = false;
      for (const genre of genres) {
        if (genre.name === game.genre) {
          genre.count++;
          found = true;
          break;
        }
      }
  
      if (!found) {
        genres.push({ name: game.genre, count: 1 });
      }
    }
  };

  async function fetchData() {
    try {
      const response = await fetch(games_list_api, requestOptions);
      const result = await response.text();
      const result_parse = JSON.parse(result);

      games = result_parse.games;

      if (games.length > 0) {
        try {
          if (window.location.pathname.includes("/dashboard")) {
            loadDashboard();
          } else {
            removePrivateGames();
            removeIrrelevantGames();

            loadGames();
          }
        } catch (error) {
          console.error(`Error trying to load games: ${error}`);
        };
      };
    } catch (error) {
      console.error(`Error trying to fetch games: ${error}`);
    };
  };

  await setPrices();
  await fetchData();

  setGenres();
  if (genres.length > 0 && document.getElementById("genres-list") != null) {
    removeIrrelevantGenres();
    loadGenres();
  }
}

async function fetchGames() {
  prices = [];
  fetchGamesRequest();
}

function setSearch() {
  if (document.getElementById("search-query") != null) {
    const search_label = document.getElementById("search-label");
    const search_query2 = document.getElementById("search-query");

    search_query2.value = search_query;
    if (search_label != null) {
      if (search_query != null) {
        search_label.textContent = `Results for '${search_query}'`;
      } else {
        window.location.assign("index");
      }
    }
  }
}

function setCategory() {
  if (window.location.pathname.includes("/category")) {
    const search_label = document.getElementById("search-label");
    search_label.textContent = `Top '${category_name}' Games`;
  }
}

fetchGames();
setSearch();
setCategory();
