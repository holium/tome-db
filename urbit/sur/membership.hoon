/-  *spaces-path
|%
::
+$  role            ?(%initiate %member %admin %owner)
+$  roles           (set role)
+$  status          ?(%invited %joined %host)
+$  alias           cord
+$  member
  $:  =roles
      =alias
      =status
  ==
+$  members         (map ship member)
+$  membership      (map path members)
::
+$  view
  $%  [%membership =membership]
      [%members =members]
      [%member =member]
      [%is-member is-member=?]
  ==
--