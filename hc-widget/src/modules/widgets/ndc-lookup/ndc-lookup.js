import _debounce from 'lodash.debounce';
import Iframe from '../../iframe';
import $ from '../../../lib/dom';
import tpl from './ndc-lookup.hbs';
import resultsTpl from './partials/results.hbs';
import suggestionsTpl from './partials/suggestions.hbs';
import API from '../../../modules/api';
import { HttpError } from '../../errors';

export default class NdcLookup {
  constructor(node, options) {
    this.options = options;
    this.options.events = {
      onLoad: this.init.bind(this)
    };

    this.loading = false;
    this.resetPage();

    if (!this.options.selection) {
      new Iframe(node, options);
    }
  }

  resetPage() {
    this.page = 1;
  }

  init($parent) {
    this.parent = $parent;

    this.$form = $(tpl());
    this.parent.append(this.$form);

    this.form = this.$form.get(0);
    this.input = this.form.querySelector('input');
    this.$results = $(this.form.querySelector('.js-results'));
    this.suggestions = this.form.querySelector('.js-suggestions');
    this.suggestionsList = this.suggestions.querySelector('.ndc-lookup__suggestions-list');
    this.closeBtn = this.form.querySelector('.js-close');

    this.form.addEventListener('submit', e => e.preventDefault());
    this.input.addEventListener('input', _debounce(e => this.onInput(e), 400));
    this.input.addEventListener('paste', e => this.onInput(e));
    this.suggestions.addEventListener('click', (e) => this.selectSuggestion(e));
    this.closeBtn.addEventListener('click', (e) => this.hideSuggestions(e));
    this.suggestions.addEventListener('scroll', (e) => this.onScroll(e));
  }

  fetchSuggestions(params) {
    return API.getDrugInfoByPredicitiveMatchGraphQl(params)
      .then(data => this.drawSuggestions(data))
      .catch(err => this.handleError(err));
  }

  fetchResults(id) {
    this.hideErrorMessages();

    return API.getDrugInfoById(id)
      .then(data => {
        if (this.options.selection) {
          this.options.onSelection(data);
        } else {
          this.drawResults(data);
        }
      })
      .catch(err => this.handleError(err));
  }

  onInput(e) {
    this.hideSuggestions();
    this.resetPage();
    const params = { q: this.input.value.trim() };

    this.fetchSuggestions(params);
  }

  onScroll(e) {
    if (this.loading) {
      return;
    }
    if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight) {
      this.showLoader();

      this.page++;
      const params = { q: this.input.value.trim(), page: this.page };
      this.fetchSuggestions(params)
        .finally(() => this.hideLoader());
    }
  }

  showLoader() {
    this.loading = true;
    const loader = $('<li class="ndc-lookup__suggestions-item js-loader">Loading...</li>').get(0);
    this.suggestionsList.appendChild(loader);
  }

  hideLoader() {
    const loader = this.suggestionsList.querySelector('.js-loader');
    $(loader).remove();

    this.loading = false;
  }

  selectSuggestion(e) {
    if (!$(e.target).matches('.js-suggestion')) {
      return;
    }

    this.resetPage();
    const id = e.target.dataset.id;

    this.fetchResults(id);
    this.hideSuggestions();
  }

  handleError(err) {
    if (err instanceof HttpError) {
    this.showServerError(err.message);
     } else {
      console.log(err);
    }
  }

  showServerError(message) {
    const messageNode = this.form.querySelector('.error-message.server');
    messageNode.innerText = message;
    messageNode.style.display = 'block';

    this.$results.get(0).innerHTML = '';

    Iframe.updateIframeHeight();
  }

  hideErrorMessages() {
    let nodes = this.form.querySelectorAll('.error-message');
    nodes.forEach(node => node.style.display = 'none');
    Iframe.updateIframeHeight();
  }

  drawResults(data) {
    const node = $(resultsTpl(data));

    this.$results.replaceWith(node);
    this.$results = node;

    Iframe.updateIframeHeight();
  }

  drawSuggestions(data) {
    const node = $(suggestionsTpl({suggestions: data})).get(0);
    const formClass = data.length > 0 ? 'ndc-lookup--searching' : 'ndc-lookup--not-found';

    this.form.classList.remove('ndc-lookup--not-found');
    this.form.classList.add(formClass);
    this.suggestions.classList.remove('hidden');
    this.closeBtn.classList.remove('hidden');

    this.suggestionsList.innerHTML += node.innerHTML;

    Iframe.updateIframeHeight();
  }

  hideSuggestions() {
    this.form.classList.remove('ndc-lookup--searching', 'ndc-lookup--not-found');
    this.suggestions.classList.add('hidden');
    this.closeBtn.classList.add('hidden');
    this.suggestionsList.innerHTML = '';

    Iframe.updateIframeHeight();
  }
}
