|%
+$  space         @t         :: space name.  if no space this is 'our'
+$  app           @t         :: app name (reduce namespace collisions).  if no app this is 'all'
+$  key           @t         :: key name
+$  json-value    [%s @t]    :: value (JSON encoded as a string).  Store with %s so we aren't constantly adding it to requests.
+$  ships    (unit (set @p))
+$  invited  (unit [read=ships create=ships overwrite=ships])
::
+$  level
  $%  %our
      %team
      %space
      %open
  ==
::
+$  meta
  $:  created-by=@p
      created-at=@da
      updated-by=@p
      updated-at=@da
  ==
::
+$  perm     [read=level create=level overwrite=level]
+$  kv       (map key json-value)
+$  kv-meta  (map key meta)
+$  store    (unit (pair kv kv-meta))
::
:: =log =feed =counter etc.
:: "invited" is in addition to the basic permission level.
::  ex. if read is %space and someone not in our space attempts to read,
::  we will also check the read invite list before rejecting.
::
+$  tome  (unit (map space (unit (map app [=perm =invited =store]))))
::
+$  tome-action
  $%  [%init-tome =space =app =perm]
      [%init-kv =space =app]
  ==
::
+$  kv-action
  $%  [%set-value =space =app =key =val]
      [%remove-value =space =app =key]
      [%clear-kv =space =app]
  ==
--

