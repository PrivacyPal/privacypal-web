/* PrivacyPal Family — standalone sub-site behaviors.
   Intentionally self-contained: this site does NOT load assets/v3.js
   (no shared nav/footer/announcement injection). */
(function(){
  'use strict';

  /* Mobile nav */
  var burger = document.querySelector('.fnav-burger');
  var links = document.querySelector('.fnav-links');
  if (burger && links){
    burger.addEventListener('click', function(){
      links.classList.toggle('open');
      burger.setAttribute('aria-expanded', links.classList.contains('open') ? 'true' : 'false');
    });
    links.addEventListener('click', function(e){
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  /* Reveal on scroll */
  var revealed = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    revealed.forEach(function(el){ io.observe(el); });
  } else {
    revealed.forEach(function(el){ el.classList.add('in'); });
  }

})();
