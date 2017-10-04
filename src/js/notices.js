function SiteNotice (args) {
  this.template = '';
  this.hideForDays = 7;
  for(var k in args) {
    this[k] = args[k];
  }
  console.log('this',this);
}

SiteNotice.prototype.start = function () {
  var scope = {};
  if(!this.shouldOpen()) {
    return
  }
  this.transform(function (err, result) {
    scope.data = result;
    this.render(scope);
  }.bind(this))
}

SiteNotice.prototype.render = function (scope) {
  var noticeEl = document.querySelector('#site-notice');
  render(noticeEl, getTemplateEl(this.template).textContent, scope);
  noticeEl.classList.toggle('hide', false);
  var height = noticeEl.getBoundingClientRect().height
  document.body.style.paddingTop = (height) + 'px';
  document.body.classList.toggle('showing-notice', true);
}

SiteNotice.prototype.close = function () {
  document.body.classList.toggle('showing-notice', true);
  var noticeEl = document.querySelector('#site-notice');
  noticeEl.classList.toggle('hide', true);
  document.body.style.paddingTop = '0px';
  setCookie('hide_notice_' + this.name, '1', this.hideForDays);
}

var completeProfileNotice = new SiteNotice({
  hideForDays: 1 / 24 / 60 / 60 / 10, //10s?
  name: 'complete-profile',
  template: 'notice-complete-profile',
  transform: function (done) {
    var obj = {};
    done(null, obj);
  },
  shouldOpen: function () {
    return isSignedIn() //TODO: && doesn't have a complete profile && han't closed this
  }
});

function closeCompleteProfileNotice (e) {
  completeProfileNotice.close();
}