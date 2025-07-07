const express = require('express');
const router = express.Router();
const db = require('./src/config/dbConnect');

router.get('/fssai-chatbot', async (req, res) => {
  try {

    // Fetch approved restaurant details
    const [restaurants] = await db.query(`
      SELECT id, name, zone, region, hygiene_score, license_number,last_inspection_date,contact_person,phone
      FROM restaurants
      WHERE status = 'approved'
    `);

    // Format restaurant section
    const restaurantSection = restaurants.map(r =>
      `🏢 ${r.name} (Zone: ${r.zone}, Region: ${r.region}, Hygiene Score: ${r.hygiene_score}, License No: ${r.license_number},Last inspection date : ${r.last_inspection_date},Contact Person : ${r.contact_person},phone number :${r.phone}) - [View Report](/user/view-report/${r.id})`
    ).join('\n');

    const fssaiIntro = `
You are an AI assistant for the FSSAI Inspector Hub platform. Guide users on:

🔹 General FSSAI rules, licenses, hygiene expectations.
🔹 How hygiene scores are calculated and what they mean.
🔹 How the platform helps users find safe restaurants.
🔹 How to view reports, favorites, and file complaints.

**FSSAI Licensing Info:**
All food businesses in India must register or obtain a license with FSSAI depending on their size and type. Each restaurant on our platform includes a valid license number for verification.

**How Hygiene Scores Work:**
- 🟢 4.1 – 5.0: Excellent
- 🟡 3.0 – 4.0: Good
- 🟠 2.0 – 2.9: Average
- 🔴 Below 2.0: Poor
Scores are based on hygiene audits that check kitchen safety, food handling, storage, and sanitation.

**Platform Help:**
- ⭐ Favorites: [View My Favorites](/user/favorites)
- 📝 File/View Complaints: [My Complaints](/user/my-complaints)
- 📄 Restaurant Reports: [View All Reports](/user/view-report/:id)

**Complaint Filing Steps:**
1. Go to 'My Complaints'
2. Select a restaurant.
3. Submit your concern.
4. FSSAI inspectors will follow up.

**Current Approved Restaurants**:
${restaurantSection}
    `;

    res.json({ prompt: fssaiIntro });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate chatbot prompt' });
  }
});

module.exports = router;
