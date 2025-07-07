const express = require('express');
const router = express.Router();
const db = require('./src/config/dbConnect');

router.get('/fssai-chatbot', async (req, res) => {
  try {
    // Fetch top 5 approved restaurant details
    const [restaurants] = await db.query(`
      SELECT id, name, zone, region, hygiene_score, license_number, last_inspection_date, contact_person, phone
      FROM restaurants
      WHERE status = 'approved'
      LIMIT 5
    `);

    // Format restaurant info into HTML links
    const restaurantSection = restaurants.map(r =>
      `🏢 <strong>${r.name}</strong> (Zone: ${r.zone}, Region: ${r.region}, Hygiene Score: ${r.hygiene_score}, License No: ${r.license_number}, Last Inspection: ${r.last_inspection_date}, Contact: ${r.contact_person}, 📞 ${r.phone})`
    ).join('<br><br>');



    const fssaiIntro = `
🤖 <strong>Hello!</strong> I am your official assistant for the <strong>FSSAI Inspector Hub</strong> platform. I specialize only in food safety, hygiene inspections, and FSSAI licensing.

🔒 <strong>Note:</strong> I respond only to food-related queries.

🍽️ <strong>FSSAI Help Topics:</strong><br>
- What is FSSAI and why is licensing important?<br>
- How hygiene scores are calculated.<br>
- Viewing inspection reports.<br>
- How to file complaints.<br>
- Approved restaurants near you.




📊 <strong>Hygiene Score Meaning:</strong><br>
🟢 4.1–5.0: Excellent<br>
🟡 3.0–4.0: Good<br>
🟠 2.0–2.9: Average<br>
🔴 Below 2.0: Poor

🧾 <strong>FSSAI License Requirement:</strong><br>
All listed restaurants are licensed by FSSAI.





🛠️ <strong>How to File a Complaint:</strong><br>
1. Select a restaurant from below.<br>
2. Click on <strong>"File Complaint"</strong>.<br>
3. Fill the form and submit.

📍 <strong>Top Approved Restaurants:</strong><br>
${restaurantSection} 

❗ <strong>Reminder:</strong> I answer only questions about food safety, inspections, and FSSAI platform features.
    `;

    res.json({ prompt: fssaiIntro });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate chatbot prompt' });
  }
});

module.exports = router;
