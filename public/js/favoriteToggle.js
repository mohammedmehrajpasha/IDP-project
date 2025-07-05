document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.favorite-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const restaurantId = button.dataset.id;
        const isFavorite = button.dataset.fav === 'true';
        const route = isFavorite ? 'remove' : 'add';
  
        try {
          const response = await fetch(`/user/favorite/${restaurantId}/${route}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
  
          if (response.ok) {
            // Toggle the state visually
            button.dataset.fav = (!isFavorite).toString();
            const icon = button.querySelector('i');
  
            if (isFavorite) {
              button.classList.remove('favorited');
              icon.classList.remove('fa-solid');
              icon.classList.add('fa-regular');
            } else {
              button.classList.add('favorited');
              icon.classList.remove('fa-regular');
              icon.classList.add('fa-solid');
            }
          } else {
            alert('Failed to update favorite. Please try again.');
          }
        } catch (err) {
          console.error('Error:', err);
        }
      });
    });
  });
  