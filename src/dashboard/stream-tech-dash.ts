/// <reference path="../../../../types/browser.d.ts" />
export {};

const showHealthRep = nodecg.Replicant<boolean>('showHeath');
const shownImageRep = nodecg.Replicant<string | null>('show-image');
const showCombatRep = nodecg.Replicant<boolean>('show-combat');

const showHpButton = document.getElementById('hp-meters') as HTMLButtonElement;
const hideImageButton = document.getElementById(
  'hide-image'
) as HTMLButtonElement;
const showCombatButton = document.getElementById(
  'combat-cam'
) as HTMLButtonElement;

showHealthRep.on('change', (newVal) => {
  if (newVal !== undefined) {
    if (newVal) {
      showHpButton.innerHTML = 'Hide HP';
      showHpButton.onclick = () => {
        showHealthRep.value = false;
      };
    } else {
      showHpButton.innerHTML = 'Show HP';
      showHpButton.onclick = () => {
        showHealthRep.value = true;
      };
    }
  }
});

hideImageButton.onclick = () => {
  shownImageRep.value = null;
};

showCombatRep.on('change', (newVal) => {
  if (newVal !== undefined) {
    if (newVal) {
      showCombatButton.innerHTML = 'Hide Combat';
      showCombatButton.onclick = () => {
        showCombatRep.value = false;
      };
    } else {
      showCombatButton.innerHTML = 'Show Combat';
      showCombatButton.onclick = () => {
        showCombatRep.value = true;
      };
    }
  }
});
