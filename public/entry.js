(function () {
  const roles = document.getElementById('roleStep'),
    games = document.getElementById('gameStep');
  document.getElementById('choosePlayer').onclick = () => {
    roles.hidden = true;
    games.hidden = false;
    document.getElementById('gameTitle').focus();
  };
  document.getElementById('backToRoles').onclick = () => {
    games.hidden = true;
    roles.hidden = false;
    document.getElementById('choosePlayer').focus();
  };
})();
