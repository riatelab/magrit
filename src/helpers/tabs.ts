// eslint-disable-next-line import/prefer-default-export
export function makeOnClickTabButton(selector: string) {
  return function onClickTabButton(
    event: Event & { currentTarget: HTMLAnchorElement },
    tab: string,
  ) {
    const tabsParentElement = event.currentTarget.parentElement!.parentElement!.parentElement!;

    // Change the active tab, reflect the change in the aria-selected attribute
    const tabButtons = tabsParentElement.querySelectorAll('li.is-active');
    for (let i = 0; i < tabButtons.length; i++) { // eslint-disable-line no-plusplus
      tabButtons[i].classList.remove('is-active');
      tabButtons[i].firstElementChild!.setAttribute('aria-selected', 'false');
    }
    event.currentTarget.parentElement!.classList.add('is-active');
    event.currentTarget.setAttribute('aria-selected', 'true');
    // Get all elements with class="tab-content" and hide them
    const tabContent = document.querySelectorAll(`.${selector}__content > div`);
    for (let i = 0; i < tabContent.length; i++) { // eslint-disable-line no-plusplus
      tabContent[i].classList.add('is-hidden');
      tabContent[i].setAttribute('hidden', 'hidden');
    }

    // Remove the class 'is-hidden' on the tab that should be opened by the button
    // and the attribute 'hidden'
    const displayedTab = document.getElementById(`${selector}__content__${tab}`) as HTMLElement;
    displayedTab.classList.remove('is-hidden');
    displayedTab.removeAttribute('hidden');
  };
}
