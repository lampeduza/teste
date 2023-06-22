// custom select
const customSelect = document.querySelector('.custom-select');

customSelect.addEventListener('click', () => {
	customSelect.classList.toggle('is-active');

	const styledSelect = customSelect.querySelector('.custom-select__styled');
	styledSelect.classList.toggle('is-active');
});