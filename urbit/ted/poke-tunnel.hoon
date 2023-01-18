/-  spider, *tome
/+  *strandio, tomelib
=,  strand=strand:spider
|%
++  decode-input
  =,  dejs:format
  |=  jon=json
  %.  jon
  %-  ot
  :~  ship+so  :: needs to have no sig
      json+so
  ==
--
^-  thread:spider
|=  arg=vase
=/  m  (strand ,vase)
^-  form:m
=/  jon=json
  (need !<((unit json) arg))
=/  input  (decode-input jon)
=/  ship  `@p`(slav %p `@t`(cat 3 '~' -.input))
=/  act  (kv-action:dejs:tomelib (need (de-json:html +.input)))
::
::  This return nothing on failure, 'success' on success.
;<  ~  bind:m  (poke [ship %tome-api] [%kv-action !>(act)])
(pure:m !>(s+'success'))