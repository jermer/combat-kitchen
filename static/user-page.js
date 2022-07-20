
// load the selected encounter into the encounter panel
$('#user-saved-encounters').on("click", '.load-encounter-btn', async function (evt) {
    const enc_id = $(this).data('eid');

    console.log(`CLICK ${enc_id}`);

    const resp = await axios.get(`/api/encounters/${enc_id}`)

    const heroes = resp.data.heroes
    const monsters = resp.data.monsters

    sessionStorage.setItem('stored_heroes', heroes)
    sessionStorage.setItem('stored_monsters', monsters)

    window.location.replace("/");
});