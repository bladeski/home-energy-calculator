var express = require('express'),
    router = express.Router(),
    knockout = require('knockout'),
    options = {
        root: __dirname + '/../public',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

router.get('/:path/:name', function(req, res, next) {
    res.sendFile('/lib' + req.path, options);
});

module.exports = router;
