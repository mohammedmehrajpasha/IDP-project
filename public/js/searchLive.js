document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.getElementById("searchBar");
    const grid = document.getElementById("restaurantGrid");
  
    searchBar.addEventListener("input", async () => {
      const query = searchBar.value.trim();
      const res = await fetch(`/user/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      grid.innerHTML = "";
  
      if (data.restaurants.length === 0) {
        grid.innerHTML = "<p>No restaurants found.</p>";
        return;
      }
  
      data.restaurants.forEach(restaurant => {
        const card = document.createElement("div");
        card.className = "card restaurant-card";
  
        let scoreClass = "badge-green";
        if (restaurant.hygiene_score < 2) scoreClass = "badge-red";
        else if (restaurant.hygiene_score < 4) scoreClass = "badge-orange";
  
        card.innerHTML = `
          <div class="top-section">
            <h3>${restaurant.name}</h3>
            <span class="badge ${scoreClass}">Score: ${restaurant.hygiene_score} / 5</span>
          </div>
          <div class="info-section">
            <p><strong>Location:</strong> ${restaurant.location}</p>
            <p><strong>Zone:</strong> ${restaurant.zone}</p>
          </div>
          <div class="button-group">
            <form action="/user/restaurant/${restaurant.id}" method="get">
              <button type="submit" class="details-btn">View Details</button>
            </form>
            <form action="/user/complaint/${restaurant.id}" method="get">
              <button type="submit" class="details-btn complaint-btn">File Complaint</button>
            </form>
            <button class="favorite-btn ${restaurant.is_favorite ? 'favorited' : ''}" 
                    data-id="${restaurant.id}" 
                    data-fav="${restaurant.is_favorite}" 
                    title="${restaurant.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}">
              <i class="fa-${restaurant.is_favorite ? 'solid' : 'regular'} fa-heart"></i>
            </button>
          </div>
        `;
  
        grid.appendChild(card);
      });
  
      attachFavoriteListeners(); // After rendering new buttons, bind listeners
    });
  
    function attachFavoriteListeners() {
      const favBtns = document.querySelectorAll(".favorite-btn");
      favBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
          const restaurantId = btn.dataset.id;
          const isFav = btn.dataset.fav === "true";
          const route = isFav ? "remove" : "add";
  
          try {
            const response = await fetch(`/user/favorite/${restaurantId}/${route}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            });
  
            if (response.ok) {
              // Toggle state
              btn.dataset.fav = (!isFav).toString();
              const icon = btn.querySelector("i");
  
              if (isFav) {
                btn.classList.remove("favorited");
                icon.classList.remove("fa-solid");
                icon.classList.add("fa-regular");
                btn.title = "Add to Favorites";
              } else {
                btn.classList.add("favorited");
                icon.classList.remove("fa-regular");
                icon.classList.add("fa-solid");
                btn.title = "Remove from Favorites";
              }
            } else {
              alert("Failed to update favorite.");
            }
          } catch (err) {
            console.error("Error:", err);
          }
        });
      });
    }
  
    attachFavoriteListeners(); // Initial call for page load
  });
  