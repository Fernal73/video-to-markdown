import $ from 'jquery';
import Prism from 'prismjs';
import NProgress from 'nprogress';
import ClipboardJS from 'clipboard';

import imageNotFound from './images/not-found.jpg';
import imageLoading from './images/loading.jpg';

const videoIcons = {
    dailymotion: require('./images/providers/dailymotion.png'),
    facebook: require('./images/providers/facebook.png'),
    vimeo: require('./images/providers/vimeo.png'),
    youtube: require('./images/providers/youtube.png'),
};

NProgress.configure({
    parent: '.preview',
    showSpinner: false
});

new ClipboardJS('.markdown');

const loadImage = (src, success = () => { }, error = () => { }) => {
    $('<img>')
        .on('load', () => {
            success.apply(this, arguments);
        })
        .on('error', () => {
            error.apply(this, arguments);
        })
        .attr('src', src);
};

const updateMarkdown = (title, imageUrl, videoUrl) => {
    const markdown =
        title === undefined ? '&nbsp;' :
        `<span class="token punctuation">[![<span class="token attr-value">${title}</span>](<span class="token attr-value">${imageUrl}</span>)](<span class="token attr-value">${videoUrl}</span> "<span class="token attr-value">${title}</span>")</span>`
    ;

    $('.markdown').toggleClass('tooltipped', title !== undefined);
    $('.markdown').attr('data-clipboard-text', $('.markdown code').html(markdown).text());
};

loadImage(imageLoading);
loadImage(imageNotFound);

let videoUrl_memo;

$('form').on('submit', function(e) {
    e.preventDefault();

    NProgress.start();

    const $form = $(this);

    const title = $form.find('[name="title"]').val();
    const videoUrl = $form.find('[name="url"]').val();
    const lambdaUrl = `${location.protocol}//${location.host}/.netlify/functions`;
    const jsonUrl = `${lambdaUrl}/image-json?url=${videoUrl}`;
    const imageUrl = `${lambdaUrl}/image?url=${videoUrl}`;

    if (videoUrl_memo === videoUrl) {
        updateMarkdown(title, imageUrl, videoUrl);
        NProgress.done();
        return false;
    }

    videoUrl_memo = videoUrl;

    $form.find('[name="url"] ~ img').attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    $('.preview img').attr('src', imageLoading);
    updateMarkdown();

    $.getJSON({
        url: jsonUrl
    })
    .done((data) => {
        loadImage(data.base64, () => {
            NProgress.done();
            $form.find('[name="url"] ~ img').attr('src', videoIcons[data.provider]);
            $('.preview img').attr('src', data.base64);
            updateMarkdown(title, imageUrl, videoUrl);
        });
    })
    .fail(() => {
        loadImage(imageNotFound, () => {
            NProgress.done();
            videoUrl_memo = imageNotFound;
            $form.find('[name="url"] ~ img').attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
            $('.preview img').attr('src', imageNotFound);
            updateMarkdown();
        });
    });
});
